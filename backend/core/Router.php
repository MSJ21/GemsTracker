<?php
namespace Core;

class Router
{
    private array $routes = [];

    public function add(string $method, string $path, callable|array $handler, bool $auth = false, bool $adminOnly = false): void
    {
        $this->routes[] = compact('method', 'path', 'handler', 'auth', 'adminOnly');
    }

    public function dispatch(string $method, string $uri): void
    {
        $uri = $this->normalizeUri($uri);

        foreach ($this->routes as $route) {
            $params = $this->match($route, $method, $uri);
            if ($params === null) continue;

            $this->applyMiddleware($route);
            $this->callHandler($route['handler'], $params);
            return;
        }

        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Route not found']);
    }

    private function normalizeUri(string $uri): string
    {
        $uri = parse_url($uri, PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        // Strip the subdirectory prefix so routes match regardless of install path
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
        if ($base !== '' && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base)) ?: '/';
        }

        return $uri;
    }

    private function match(array $route, string $method, string $uri): ?array
    {
        if ($route['method'] !== $method) {
            return null;
        }

        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $route['path']);
        if (!preg_match('#^' . $pattern . '$#', $uri, $matches)) {
            return null;
        }

        return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
    }

    private function applyMiddleware(array $route): void
    {
        if ($route['adminOnly']) {
            \App\Middleware\AdminMiddleware::handle();
        } elseif ($route['auth']) {
            \App\Middleware\AuthMiddleware::handle();
        }
    }

    private function callHandler(callable|array $handler, array $params): void
    {
        if (is_callable($handler)) {
            $handler($params);
        } else {
            [$class, $action] = $handler;
            (new $class())->{$action}($params);
        }
    }
}
