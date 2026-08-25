export const APP_NAME = 'Wooly Launcher'
export const APP_ID = 'net.wooly.launcher'
export const LAUNCHER_BRAND = 'wooly'
export const LAUNCHER_VERSION = '0.1.0'

export const MS_SCOPES = ['XboxLive.signin', 'offline_access']

export const MOJANG = {
  versionManifest: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
  entitlements: 'https://api.minecraftservices.com/entitlements/mcstore',
  profile: 'https://api.minecraftservices.com/minecraft/profile',
  loginWithXbox: 'https://api.minecraftservices.com/authentication/login_with_xbox',
  xboxUserAuth: 'https://user.auth.xboxlive.com/user/authenticate',
  xboxXsts: 'https://xsts.auth.xboxlive.com/xsts/authorize'
} as const

export const IPC = {
  bootstrap: 'wooly:bootstrap',
  windowMinimize: 'wooly:window:minimize',
  windowMaximize: 'wooly:window:maximize',
  windowClose: 'wooly:window:close',
  windowIsMaximized: 'wooly:window:isMaximized',
  settingsGet: 'wooly:settings:get',
  settingsSet: 'wooly:settings:set',
  accountsList: 'wooly:accounts:list',
  accountsLogin: 'wooly:accounts:login',
  accountsLogout: 'wooly:accounts:logout',
  accountsSelect: 'wooly:accounts:select',
  instancesList: 'wooly:instances:list',
  instancesCreate: 'wooly:instances:create',
  instancesUpdate: 'wooly:instances:update',
  instancesDelete: 'wooly:instances:delete',
  catalogVersions: 'wooly:catalog:versions',
  catalogRefresh: 'wooly:catalog:refresh',
  installStart: 'wooly:install:start',
  installCancel: 'wooly:install:cancel',
  launchPlay: 'wooly:launch:play',
  launchStop: 'wooly:launch:stop',
  openPath: 'wooly:open-path'
} as const

export const EVENTS = {
  splash: 'wooly:event:splash',
  catalog: 'wooly:event:catalog',
  install: 'wooly:event:install',
  logs: 'wooly:event:logs',
  launch: 'wooly:event:launch',
  auth: 'wooly:event:auth',
  accounts: 'wooly:event:accounts',
  instances: 'wooly:event:instances',
  maximized: 'wooly:event:maximized'
} as const
