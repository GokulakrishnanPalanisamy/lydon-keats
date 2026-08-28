#!/bin/sh
set -e

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
    echo "Installing composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if ! grep -q "^APP_KEY=.\+" .env; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

echo "Running database migrations..."
php artisan migrate --force

exec "$@"
