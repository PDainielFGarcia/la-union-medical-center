<?php

namespace App\Support;

final class ContactRules
{
    public const REGEX = '/^\d{11}$/';

    public const RULE = ['required', 'string', 'regex:/^\d{11}$/'];

    public const OPTIONAL_RULE = ['nullable', 'string', 'regex:/^\d{11}$/'];
}
