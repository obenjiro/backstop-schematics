# BackstopJS Angular Schematics

This repository is an Angular Schematic for BackstopJS. This library dose visual regression testing automation of your responsive web UI by comparing DOM screenshots over time.

### Quick Start

```bash
ng add backstop-schematics
```

Don't forget that you need runt `npm run backstop:test` and `npm run backstop:approve` to create refrence screenshots right after installation.

### Usage

```bash
# to run test
npm run backstop:test

# to make current scrreenshot to be a 'refrence' screenshots
npm run backstop:approve
```

For everything else plz refer to official BackstopJS documentaion 
https://github.com/garris/BackstopJS