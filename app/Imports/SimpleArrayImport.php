<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

class SimpleArrayImport implements ToArray
{
    protected array $data = [];

    public function array(array $array): void
    {
        $this->data = $array;
    }

    public function getData(): array
    {
        return $this->data;
    }
}
