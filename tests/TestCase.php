<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use PDO;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        $this->ensureMysqlTestDatabaseExists();

        parent::setUp();
    }

    protected function ensureMysqlTestDatabaseExists(): void
    {
        $connection = $_ENV['DB_CONNECTION'] ?? getenv('DB_CONNECTION') ?? '';
        if ($connection !== 'mysql') {
            return;
        }

        $database = $_ENV['DB_DATABASE'] ?? getenv('DB_DATABASE') ?? '';
        if ($database === '') {
            return;
        }

        $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? '127.0.0.1';
        $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '3306';
        $username = $_ENV['DB_USERNAME'] ?? getenv('DB_USERNAME') ?? 'root';
        $password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?? '';
        $escapedDatabase = str_replace('`', '``', $database);

        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port),
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );

        $pdo->exec(
            sprintf(
                'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
                $escapedDatabase,
            ),
        );
    }
}
