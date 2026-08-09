// Both re-exports are transitional: `AppLayout` and `SharedCard` survive only
// until the /s/* surfaces move onto WorkspaceShell (workspace doc 22, C1/2.1),
// at which point this barrel goes with them.
export * from './app-layout';
export * from './shared-card';