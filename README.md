# cache-buster

A very simple cache buster for fingerprinting asset files.

> **Warning!** This tool is intended to be used for production and should be executed in the release phase of your deployment. It cannot be undone and will not backup your files!

## Install

``` shell
npm install @jens-andre/cache-buster
```

## Usage

Create a configuration file named `.cache-buster.json`

``` json
{
  "publicPath": "Public",
  "source": "Public/assets/**/*",
  "target": "{Public/assets,Resources/Views}/**/*.{css,js,leaf}",
  "url": "https://example.com",
  "hashLength": 7
}
```

Provide your **`publicPath`**, the [glob patterns](https://github.com/mrmlnc/fast-glob#pattern-syntax) for the **`source`** of your compiled assets and **`target`** for your templates and/or assets. Optionaly you can provide an **`url`** and a **`hashLength`** (default is 7).

In your application directory make a dry run to test it out with the following command

``` shell
cache-buster -d
```

CLI Options

``` shell
      --help     Show help                         [boolean]
      --version  Show version number               [boolean]
  -d, --dry      Runs without making replacements  [boolean]
  -q, --quiet    Supresses success output          [boolean]
```

## License

Released und the MIT License.
