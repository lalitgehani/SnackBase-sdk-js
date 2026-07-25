# @snackbase/mcp release checklist

Use for parity releases (e.g. 0.3.0 MCP–SDK parity).

1. [ ] `pnpm --filter @snackbase/mcp test` green (includes `sdk-mcp-coverage.test.ts`)
2. [ ] `pnpm --filter @snackbase/mcp typecheck` green
3. [ ] `pnpm --filter @snackbase/mcp build` green; `dist/index.mjs` present
4. [ ] Registered tools count matches docs (currently **22**: 15 core + 5 automation + files + codelists)
5. [ ] `implemented_but_unregistered` = 0
6. [ ] Intentional non-exposure allowlist reviewed (auth, realtime, records.query, invitation accept/getPublic, files.upload)
7. [ ] CHANGELOG entries for Added / Fixed / Documentation
8. [ ] package.json version bumped
9. [ ] Mintlify `docs/mcp/**` lists real tools; no claims for unexposed domains
10. [ ] Skills audit: no unregistered `snackbase_*` MCP tool names
11. [ ] Auth policy documented (API key only; superadmin blast radius)
12. [ ] Optional: live smoke with `SNACKBASE_URL` + `SNACKBASE_API_KEY`
