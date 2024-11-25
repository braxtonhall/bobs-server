export enum ThemeMode {
	Light = "light",
	System = "system",
	Dark = "dark",
}
export const isThemeMode = (mode: unknown): mode is ThemeMode =>
	([ThemeMode.Light, ThemeMode.System, ThemeMode.Dark] as unknown[]).includes(mode);
