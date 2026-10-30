$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8000/api'

function Login($login) {
    $r = Invoke-RestMethod -Method Post -Uri "$base/login" -ContentType 'application/json' -Body (@{ login = $login; password = '12345678' } | ConvertTo-Json)
    $token = if ($r.data) { $r.data.token } else { $r.token }
    return @{ Authorization = "Bearer $token"; Accept = 'application/json' }
}

function Call($method, $path, $headers, $body = $null) {
    try {
        $params = @{ Method = $method; Uri = "$base$path"; Headers = $headers; ContentType = 'application/json' }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 5) }
        $r = Invoke-RestMethod @params
        return @{ ok = $true; data = $r.data; raw = $r }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        return @{ ok = $false; status = $status; error = $_.ErrorDetails.Message }
    }
}

function Check($label, $cond, $detail = '') {
    if ($cond) { Write-Output "PASS  $label" } else { Write-Output "FAIL  $label $detail" }
}

function VBody($extra) {
    $base = @{
        first_name = 'Maria'
        middle_name = 'Cruz'
        last_name = 'Santos'
        address = 'San Fernando'
        contact_number = '09170000001'
        purpose = 'Official Business'
    }
    foreach ($k in $extra.Keys) { $base[$k] = $extra[$k] }
    return $base
}

$guard = Login 'guard'
$sec = Login 'secretary.accounting'
$acct = Login 'secretary.billing'
$nurse = Login 'nurse'
$opd = Login 'opd'
$adm = $opd
$admin = Login 'admin'
$doc = Login 'dr.reyes'

$depts = (Call Get '/departments' $guard).data
Check '12 offices seeded' (@($depts).Count -eq 12)
$opdDept = ($depts | Where-Object code -eq 'ACCT').id
$areas = (Call Get '/parking-areas' $guard).data

# Visitors — office
$v = Call Post '/visitors' $guard (VBody @{
    department_id = $opdDept
    person_to_visit = 'Juan Dela Cruz'
    age = 30
    vehicle = @{ plate_number = 'abc 1234'; parking_area_id = $areas[0].id; slot_number = 'A-3' }
})
Check 'guard registers same-day visitor' ($v.ok -and $v.data.status -eq 'pending_approval') $v.error
Check 'vehicle recorded with visitor' ($v.data.vehicle_plate -eq 'ABC 1234' -and $v.data.parking_area) ''
Check 'visitor names capitalized' ($v.data.first_name -eq 'Maria' -and $v.data.full_name -like '*Santos*') ''
$id = $v.data.id

$minorOk = Call Post '/visitors' $guard (VBody @{
    first_name = 'Kid'; middle_name = 'A'; last_name = 'Visitor'
    contact_number = '09170000002'; department_id = $opdDept; age = 10
})
Check 'minor visitor allowed without guardian' ($minorOk.ok -and $minorOk.data.status -eq 'pending_approval') $minorOk.error

$dup = Call Post '/visitors' $guard (VBody @{ department_id = $opdDept })
Check 'duplicate open visit blocked (409)' (-not $dup.ok -and $dup.status -eq 409)

$early = Call Post '/visitor-passes/scan' $guard @{ token = 'VISIT-PASS:deadbeef' }
Check 'unknown QR returns 404' (-not $early.ok -and $early.status -eq 404)

$wrong = Call Post "/visitors/$id/approve" $acct
Check 'other department secretary cannot approve (403)' (-not $wrong.ok -and $wrong.status -eq 403)

$guardApprove = Call Post "/visitors/$id/approve" $guard
Check 'guard cannot approve office visit (403)' (-not $guardApprove.ok -and $guardApprove.status -eq 403)

$secList = (Call Get '/visitors' $acct).data
Check 'billing secretary does not see accounting visitors' (@($secList).Count -eq 0)

$secPatients = Call Get '/patients' $sec
Check 'secretary has no patient access (403)' (-not $secPatients.ok -and $secPatients.status -eq 403)

$ap = Call Post "/visitors/$id/approve" $sec
Check 'accounting secretary approves and QR issued' ($ap.ok -and $ap.data.status -eq 'approved' -and $ap.data.qr_token.Length -eq 48) $ap.error
$token = "VISIT-PASS:$($ap.data.qr_token)"

$in = Call Post '/visitor-passes/scan' $guard @{ token = $token }
Check 'first scan = entry' ($in.ok -and $in.data.action -eq 'entry' -and $in.data.visit.status -eq 'inside') $in.error
$out = Call Post '/visitor-passes/scan' $guard @{ token = $token }
Check 'second scan = exit' ($out.ok -and $out.data.action -eq 'exit' -and $out.data.visit.status -eq 'completed') $out.error
$again = Call Post '/visitor-passes/scan' $guard @{ token = $token }
Check 'third scan rejected (pass used)' (-not $again.ok -and $again.status -eq 422)

$reasons = (Call Get '/rejection-reasons' $sec).data
$v2 = Call Post '/visitors' $guard (VBody @{
    first_name = 'Pedro'; middle_name = 'L'; last_name = 'Penduko'
    contact_number = '09170000003'; purpose = 'Delivery'; department_id = $opdDept
})
$rj = Call Post "/visitors/$($v2.data.id)/reject" $sec @{ rejection_reason_id = $reasons[0].id }
Check 'secretary rejects with reason' ($rj.ok -and $rj.data.status -eq 'rejected' -and $rj.data.rejection_reason) $rj.error

# Patient visits
$inp = (Call Get '/inpatients' $guard).data
Check 'guard sees admitted patients (3) and wards (6)' (@($inp.patients).Count -eq 3 -and @($inp.wards).Count -eq 6)
$juan = $inp.patients | Where-Object bed_number -eq 'MW1-PR-01'
$pv = Call Post '/visitors' $guard (VBody @{
    visit_type = 'patient'; admission_id = $juan.admission_id
    first_name = 'Ana'; middle_name = 'M'; last_name = 'Dela Cruz'
    contact_number = '09170000010'; purpose = 'Patient Visit'; age = 40
})
Check 'guard approves patient visit, QR issued' ($pv.ok -and $pv.data.status -eq 'approved' -and $pv.data.qr_token.Length -eq 48 -and $pv.data.visit_location -like '*MW1-PR-01*' -and $pv.data.person_to_visit -like '*Juan*Dela Cruz*') $pv.error
$pvBad = Call Post '/visitors' $guard (VBody @{
    visit_type = 'patient'; admission_id = 99999
    first_name = 'No'; middle_name = 'B'; last_name = 'Body'
    contact_number = '09170000011'; purpose = 'Patient Visit'
})
Check 'patient not admitted -> cannot approve (422)' (-not $pvBad.ok -and $pvBad.status -eq 422)
$pvDup = Call Post '/visitors' $guard (VBody @{
    visit_type = 'patient'; admission_id = $juan.admission_id
    first_name = 'Ana'; middle_name = 'M'; last_name = 'Dela Cruz'
    contact_number = '09170000010'; purpose = 'Patient Visit'
})
Check 'duplicate patient visit blocked (409)' (-not $pvDup.ok -and $pvDup.status -eq 409)
$secSees = (Call Get '/visitors' $sec).data | Where-Object id -eq $pv.data.id
Check 'secretaries do not see patient visits' ($null -eq $secSees)
$nurseInp = Call Get '/inpatients' $nurse
Check 'inpatient lookup is guard-only (403 for nurse)' (-not $nurseInp.ok -and $nurseInp.status -eq 403)
$pvIn = Call Post '/visitor-passes/scan' $guard @{ token = "VISIT-PASS:$($pv.data.qr_token)" }
Check 'patient visitor entry scan' ($pvIn.ok -and $pvIn.data.action -eq 'entry') $pvIn.error

# Patients / OPD — adult
$p = Call Post '/patients' $opd @{
    first_name = 'rosa'; last_name = 'lim'; middle_name = 'a'
    birthday = '1985-02-03'; sex = 'Female'; complete_address = 'Agoo'
    contact_number = '09171234567'; philhealth_number = '12-345678901-2'
}
Check 'OPD registers patient with PhilHealth' ($p.ok -and $p.data.patient_id -eq 'LUMC-0004' -and $p.data.first_name -eq 'Rosa') $p.error

# Minor without guardian rejected
$minorBad = Call Post '/patients' $opd @{
    first_name = 'Tiny'; last_name = 'Tot'; middle_name = 'B'
    birthday = '2018-01-01'; sex = 'Male'; complete_address = 'Agoo'; contact_number = '09171234568'
}
Check 'minor patient without guardian rejected (422)' (-not $minorBad.ok -and $minorBad.status -eq 422)

$clinics = (Call Get '/clinics' $opd).data
$med = ($clinics | Where-Object code -eq 'MED').id
$q = Call Post '/opd-registrations' $opd @{ patient_id = $p.data.id; clinic_id = $med; reason = 'Check-up'; cough = $true; fever = $true; notes = 'registration screening' }
Check 'hospital visit queue MED-001 with screening' ($q.ok -and $q.data.queue_number -eq 'MED-001' -and $null -eq $q.data.doctor_id -and $q.data.screened -eq $true) $q.error
$tr = Call Post "/opd-encounters/$($q.data.opd_encounter_id)/triage" $nurse @{ cough = $true; fever = $true; notes = 'updated notes' }
Check 'nurse updates triage checklist' $tr.ok $tr.error
$docPed = Login 'dr.santos'
$pedBlocked = Call Post "/queues/$($q.data.id)/call" $docPed
Check 'pediatrics doctor cannot call MED queue (403)' (-not $pedBlocked.ok -and $pedBlocked.status -eq 403) $pedBlocked.error
$call = Call Post "/queues/$($q.data.id)/call" $doc
Check 'doctor calls queue in own clinic' ($call.ok -and $call.data.status -eq 'called') $call.error
$nurseCall = Call Post "/queues/$($q.data.id)/serve" $nurse
Check 'nurse can interact across clinics' ($nurseCall.ok -and $nurseCall.data.status -eq 'serving') $nurseCall.error
$undoQ = Call Post "/queues/$($q.data.id)/undo" $doc
Check 'one-step queue undo serving->called' ($undoQ.ok -and $undoQ.data.status -eq 'called' -and $undoQ.data.undo_used -eq $true) $undoQ.error
$serve2 = Call Post "/queues/$($q.data.id)/serve" $doc
Check 'doctor serves again after undo' ($serve2.ok -and $serve2.data.status -eq 'serving') $serve2.error
$docs = (Call Get '/doctors' $doc).data
$otherDoc = $docs | Where-Object { $_.user_id -ne $null -and $_.name -like '*Carlo*' } | Select-Object -First 1
$availDenied = Call Put "/doctors/$($otherDoc.id)" $doc @{ status = 'unavailable' }
Check 'doctor cannot change another doctor availability (403)' (-not $availDenied.ok -and $availDenied.status -eq 403) $availDenied.error
$selfDoc = $docs | Where-Object { $_.name -like '*Reyes*' } | Select-Object -First 1
$availSelf = Call Put "/doctors/$($selfDoc.id)" $doc @{ status = 'unavailable' }
Check 'doctor can change own availability' ($availSelf.ok -and $availSelf.data.status -eq 'unavailable') $availSelf.error
$availOpd = Call Put "/doctors/$($selfDoc.id)" $opd @{ status = 'available' }
Check 'OPD can change doctor availability' ($availOpd.ok -and $availOpd.data.status -eq 'available') $availOpd.error
$availNurse = Call Put "/doctors/$($selfDoc.id)" $nurse @{ status = 'unavailable' }
Check 'nurse cannot change doctor availability (403)' (-not $availNurse.ok -and $availNurse.status -eq 403) $availNurse.error

# Beds / admissions RBAC
$wards = (Call Get '/wards' $nurse).data
Check 'nurse can view wards (6)' (@($wards).Count -eq 6)
$freeBed = ($wards[0].beds | Where-Object status -eq 'available' | Select-Object -First 1)
$nurseAssign = Call Post '/admissions' $nurse @{ patient_id = $p.data.id }
Check 'nurse cannot create admission (403)' (-not $nurseAssign.ok -and $nurseAssign.status -eq 403)
$docBed = Call Post "/beds/$($freeBed.id)/status" $doc @{ status = 'maintenance' }
Check 'doctor cannot change bed (403)' (-not $docBed.ok -and $docBed.status -eq 403)
$a = Call Post '/admissions' $adm @{ patient_id = $p.data.id; bed_id = $freeBed.id; reason = 'Observation' }
Check 'admission staff admits into bed' ($a.ok -and $a.data.status -eq 'admitted' -and $a.data.bed_number -eq $freeBed.bed_number) $a.error
$beds = (Call Get '/beds?ward=MW1' $doc).data
$occ = $beds | Where-Object id -eq $freeBed.id
Check 'doctor sees patient in bed' ($occ.status -eq 'occupied' -and $occ.patient_name -like '*Rosa*Lim*')
$otherBed = ($beds | Where-Object status -eq 'available' | Select-Object -First 1)
$tf = Call Post "/admissions/$($a.data.id)/assign" $adm @{ bed_id = $otherBed.id }
Check 'transfer to another bed' ($tf.ok -and $tf.data.bed_number -eq $otherBed.bed_number) $tf.error
$undoBed = Call Post "/admissions/$($a.data.id)/undo" $adm
Check 'one-step undo transfer' ($undoBed.ok -and $undoBed.data.bed_number -eq $freeBed.bed_number) $undoBed.error
$tf2 = Call Post "/admissions/$($a.data.id)/assign" $adm @{ bed_id = $otherBed.id }
$dc = Call Post "/admissions/$($a.data.id)/discharge" $adm @{ discharge_notes = 'Went home' }
Check 'discharge frees bed (cleaning)' ($dc.ok -and $dc.data.status -eq 'discharged') $dc.error

# Profile
$prof = Invoke-RestMethod -Method Put -Uri "$base/profile" -Headers $opd -ContentType 'application/json' -Body (@{
    first_name = 'Opd'; middle_name = 'Admission'; last_name = 'Staff'
    login = 'opd'; contact_number = '09170000003'
} | ConvertTo-Json)
Check 'profile update' ($prof.login -eq 'opd' -and $prof.contact_number -eq '09170000003')

# Parking
$veh = Call Post '/vehicles' $guard @{ plate_number = 'XYZ 999'; owner_type = 'patient'; patient_id = $p.data.id; parking_area_id = $areas[1].id }
Check 'guard parks patient vehicle' ($veh.ok -and $veh.data.owner -like '*Rosa*Lim*') $veh.error
$vx = Call Post "/vehicles/$($veh.data.id)/exit" $guard
Check 'vehicle exit' ($vx.ok -and $vx.data.status -eq 'exited') $vx.error

# Reports, exports, backups
$daily = Call Get '/reports/daily' $admin
Check 'daily summary' ($daily.ok -and $daily.data.visitors.entered -ge 1 -and $daily.data.patients.opd_arrivals -ge 1) $daily.error
$nurseReport = Call Get '/reports/daily' $nurse
Check 'nurse cannot see reports (403)' (-not $nurseReport.ok -and $nurseReport.status -eq 403)

$tmp = Join-Path $env:TEMP 'lumc-smoke'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
foreach ($t in 'patients', 'visitors', 'audit') {
    try {
        Invoke-WebRequest -Uri "$base/reports/daily/$t.pdf" -Headers $admin -OutFile "$tmp\$t.pdf"
        $head = [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes("$tmp\$t.pdf")[0..3])
        Check "PDF $t" ($head -eq '%PDF')
    } catch {
        Check "PDF $t" $false $_.Exception.Message
    }
}
foreach ($d in 'patients', 'opd', 'admissions', 'census', 'visitors', 'vehicles', 'audit') {
    Invoke-WebRequest -Uri "$base/exports/$d.csv" -Headers $admin -OutFile "$tmp\$d.csv"
    $lines = (Get-Content "$tmp\$d.csv" -Encoding UTF8).Count
    Check "CSV $d ($lines lines)" ($lines -ge 1)
}

$bk = Call Post '/backups' $admin
Check 'backup created' ($bk.ok -and $bk.data.size -gt 1000) $bk.error
$list = (Call Get '/backups' $admin).data
Check 'backup listed' (@($list).Count -ge 1)
Write-Output "Files in $tmp"
