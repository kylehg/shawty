Shawty
======

A simple URL-shortener.


## API

All routes accept either form-encoded or JSON payloads, and return JSON.
Responses will always be an object with either a `data` or an `error` field.


### `GET /`

Returns a route page.


### `POST /`

Creates a new short URL.

#### Payload

- `url` (string) _required_: The target URL.
- `customPath` (string) _optional_: The desired path to shorten to. Must be in
  `[A-Za-z0-9-_]`. If not provided, a random short code is generated instead.

#### Response

##### `201 Created`

A new shortened URL was created.

- `url` (string): The URL provided.
- `shortUrl` (string): The shortened URL.

##### `400 Bad Request`

The request had missing or invalid params.

- `message` (string): The error message.

##### `409 Conflict`

The requested `customPath` is already in use.

- `message` (string): The error message.


### `GET /:shortPath`

Redirects to the shortened URL.
