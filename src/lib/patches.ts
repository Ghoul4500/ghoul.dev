// My kernel patches, shared by the homepage and the résumé. To add one, append
// an entry here (and regenerate the résumé PDF); nothing else needs rewriting.

export interface Patch {
  /** Short SHA as shown. */
  sha: string;
  /** SHA used in the commit link. */
  hash: string;
  /** Driver or subsystem. */
  area: string;
  /** Commit subject line, verbatim. */
  subject: string;
  /** What it does and where it landed. */
  text: string;
}

/** Merged in Linus' tree, newest first. */
export const patches: Patch[] = [
  {
    sha: '4563e59', hash: '4563e596bd91', area: 'usbhid',
    subject: 'HID: usbhid: skip interrupt IN polling for devices with no input reports',
    text: 'ASUS N-Key keyboards dropped and stuck keys in certain games. Their second, RGB-only interface declares no input reports, and polling it made the firmware lose key-down and key-up events on the keyboard interface. The fix I proposed targeted the bug at the root cause, skipping the poll for every usbhid device that declares no input reports. Merged for 7.4 after a contested review, backported to stable 7.3.2.',
  },
  {
    sha: 'bcbdfe0', hash: 'bcbdfe03566a', area: 'asus-wmi',
    subject: 'platform/x86: asus-wmi: validate custom fan curves on enable',
    text: 'Validate custom fan curves on enable, rejecting curves the firmware does not honour so sysfs keeps describing what the fans do. Merged for 7.4; backported to 7.3, 6.18, 6.12, 6.6 and 6.1 stable.',
  },
  {
    sha: '7bc99df', hash: '7bc99dff4d97', area: 'asus-armoury',
    subject: 'platform/x86: asus-armoury: gate PPT writes behind active fan curve',
    text: 'Gated PPT power-limit writes behind an active custom fan curve on the 30 models where firmware silently ignored them. Shipped in 7.3.',
  },
  {
    sha: 'd2d2e7c', hash: 'd2d2e7c8fb37b27301ee5c8343b2f7037efc6ea6', area: 'asus-armoury',
    subject: 'platform/x86: asus-armoury: fix mini-LED mode get/set on MODE2 devices',
    text: 'Fixed mini-LED mode get/set on 2024+ hardware. Reads decoded a constant instead of the device value, and writes skipped the firmware mode map. Merged in 7.1, backported to 7.0 stable.',
  },
];

/** Posted to the mailing list, not merged yet. */
export const pending: Pick<Patch, 'area' | 'text'>[] = [
  { area: 'asus-armoury', text: 'Two-patch series fixing sysfs notifications and pending_reboot for grouped attributes.' },
];

export const LORE = 'https://lore.kernel.org/all/?q=f:yaseen@ghoul.dev';
export const commitUrl = (p: Patch) => `https://github.com/torvalds/linux/commit/${p.hash}`;
