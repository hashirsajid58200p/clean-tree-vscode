# Change Log

All notable changes to the "Clean Tree" extension will be documented in this file.

## [0.0.3] - 2026-03-02

### Added

- **MIT License:** Officially added the MIT License to the project for legal protection and open-source compliance.

### Fixed

- **Bundle Optimization:** Massively reduced the extension install size by excluding unnecessary development files and media from the final package.
- **Icon Resolution:** Fixed a publishing error by properly including the extension icon while excluding other heavy assets.

---

## [0.0.2] - 2026-03-02

### Added

- **Persistent Settings:** Extension now remembers your toggle preferences (Icons, Hidden Files, Dependencies) even after restarting VS Code.
- **Copy to Clipboard:** New "Copy" button in the header allows you to grab the tree structure instantly.
- **Massive Icon Library:** Expanded support for Python, Java, C++, C#, Rust, PHP, Ruby, and more.
- **Improved Header UI:** Pixel-perfect, sticky navigation bar with uniform button heights and a support heart icon.
- **Media Support:** Added demo video and screenshot gallery to the marketplace page.

### Fixed

- Fixed an issue where the heart icon was not perfectly centered in its button.
- Improved folder/file sorting logic to ensure folders always appear at the top.

---

## [0.0.1] - 2026-02-28

- Initial release of Clean Tree!
- Support for generating interactive ASCII file trees.
- Basic filtering for `node_modules` and `.git` folders.
