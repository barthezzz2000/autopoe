import os

from PyInstaller.utils.hooks import collect_submodules

block_cipher = None
root = os.path.abspath(".")

hiddenimports = (
    collect_submodules("app")
    + collect_submodules("uvicorn")
)

a = Analysis(
    ["app/cli.py"],
    pathex=[root],
    datas=[
        ("app/static", "app/static"),
    ],
    hiddenimports=hiddenimports,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="synode",
    debug=False,
    strip=True,
    upx=False,
    console=True,
)
