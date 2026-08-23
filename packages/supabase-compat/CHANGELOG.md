# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-24

### Fixed

- `select(columns, { count })` now reports the row count. The non-`single()` path had the condition
  inverted — requesting a count returned `undefined` and the server's total was discarded, while
  omitting one returned `null`. It now returns the total when a count is requested and `null`
  otherwise, matching Supabase.

### Added

- First test suite for the package: query-builder filter/sort/projection/paging translation,
  `single()` and count behaviour, insert/update/upsert/delete mutation paths, `wrap()` error
  normalisation, and client construction. 48 tests.

### Changed

- Requires `@snackbase/sdk` 0.9.0. Published builds pin the SDK exactly, so this release is
  required to pick up the 0.9.0 client.

## [0.1.1] - 2026-08-03

### Changed

- Release alignment with `@snackbase/sdk` 0.8.0 and SnackBase backend 0.8.0.
