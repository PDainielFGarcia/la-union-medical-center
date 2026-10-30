<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 28px 28px 40px 28px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #0f172a; }
        header { border-bottom: 2px solid #1d4ed8; padding-bottom: 6px; margin-bottom: 10px; }
        header h1 { font-size: 15px; margin: 0; color: #1d4ed8; }
        header p { margin: 2px 0 0; color: #475569; }
        h2 { font-size: 11px; margin: 14px 0 6px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: left; vertical-align: top; }
        th { background: #e2e8f0; font-weight: bold; }
        tr:nth-child(even) td { background: #f8fafc; }
        .summary td { width: 25%; border: none; padding: 4px 6px; }
        .summary .label { color: #64748b; }
        .summary .value { font-size: 13px; font-weight: bold; }
        .empty { color: #64748b; font-style: italic; }
        footer { position: fixed; bottom: -24px; left: 0; right: 0; font-size: 8px; color: #64748b; }
    </style>
</head>
<body>
<header>
    <h1>{{ $hospital }}</h1>
    <p><strong>{{ $title }}</strong> &middot; {{ $date->format('l, F j, Y') }}</p>
    <p>Generated {{ now()->format('M j, Y g:i A') }} by {{ $generatedBy }}</p>
</header>

@if (! empty($summary))
    <table class="summary">
        @foreach (array_chunk($summary, 4, true) as $chunk)
            <tr>
                @foreach ($chunk as $label => $value)
                    <td><div class="label">{{ $label }}</div><div class="value">{{ $value }}</div></td>
                @endforeach
            </tr>
        @endforeach
    </table>
@endif

@foreach ($sections as $section)
    <h2>{{ $section['title'] }} ({{ count($section['rows']) }})</h2>
    @if (count($section['rows']))
        <table>
            <thead>
            <tr>
                @foreach ($section['columns'] as $column)
                    <th>{{ $column }}</th>
                @endforeach
            </tr>
            </thead>
            <tbody>
            @foreach ($section['rows'] as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">No records.</p>
    @endif
@endforeach

<footer>{{ $hospital }} &middot; {{ $title }} &middot; Administrative data only. Confidential.</footer>
</body>
</html>
