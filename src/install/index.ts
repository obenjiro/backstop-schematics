import {
  apply,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
  forEach,
  FileEntry,
  chain,
  SchematicsException
} from '@angular-devkit/schematics';
import { normalize } from 'path';
import { getWorkspace } from '@schematics/angular/utility/config';
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function setupOptions(host: Tree, options: any): Tree {
  const workspace = getWorkspace(host);
  if (!options.project) {
    options.project = Object.keys(workspace.projects)[0];
  }
  const project = workspace.projects[options.project];

  options.path = normalize(project.root);
  return host;
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function install(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setupOptions(tree, _options);

    return chain([
      copyTemplateFiles(_options, tree),
      addAllDependencies(),
      addScripts(),
      addGitIgnoreFolders()
    ])(tree, _context);
  };
}

function copyTemplateFiles(_options: any, tree: Tree): Rule {
  const movePath = normalize(_options.path + '/');

  const templateSource = apply(url('../../files/'), [
    template({ ..._options }),
    move(movePath),
    // fix for https://githubx.com/angular/angular-cli/issues/11337
    forEach((fileEntry: FileEntry) => {
      if (tree.exists(fileEntry.path)) {
        tree.overwrite(fileEntry.path, fileEntry.content);
      }
      return fileEntry;
    }),
  ]);

  return mergeWith(templateSource, MergeStrategy.Overwrite);
}

function addAllDependencies(): Rule {
  return (host: Tree, _context: SchematicContext) => {
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Dev,
      name: 'concurrently',
      version: '^5.3.0',
      overwrite: true
    });
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Dev,
      name: 'wait-on',
      version: '^5.2.0',
      overwrite: true
    });
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Dev,
      name: 'backstopjs',
      version: '^5.0.4',
      overwrite: true
    })

    _context.addTask(new NodePackageInstallTask());
  };
}

function addScripts(): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const pkgPath = '/package.json';
    const buffer = host.read(pkgPath);

    if (buffer === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const pkg = JSON.parse(buffer.toString());
    pkg.scripts['backstop:approve'] = "backstop approve";
    pkg.scripts['backstop:test'] = "concurrently -k -s first \"npm run start\" \"wait-on tcp:4200 && backstop test\"";
    host.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
    return host;
  }
}


function addGitIgnoreFolders(): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const gitIgnorePath = '/.gitignore';
    const buffer = host.read(gitIgnorePath);

    const ignore = 'backstop_data/bitmaps_test\nbackstop_data/html_report';

    if (buffer === null) {
      host.create(gitIgnorePath, ignore);
    } else {
      host.overwrite(gitIgnorePath, buffer.toString() + '\n' + ignore);
    }

    return host;
  }
}