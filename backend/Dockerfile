FROM php:8.4-cli-alpine

RUN apk add --no-cache \
        git \
        unzip \
        curl \
        mysql-client \
        oniguruma-dev \
        libzip-dev \
        $PHPIZE_DEPS \
        linux-headers \
    && docker-php-ext-install pdo pdo_mysql mbstring bcmath zip pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
