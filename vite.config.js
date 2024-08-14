import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import * as fs from 'fs/promises'
import { glob } from 'glob'
import tailwindcss from 'tailwindcss'
import { defineConfig } from 'vite'
import packageJson from './package.json'

const peerDependencies = packageJson.peerDependencies ? Object.keys(packageJson.peerDependencies) : []

const createEntries = () => {
  const entries = new Map()
  const excludeFiles = []

  for (const file of glob.sync('src/**/*.js')) {
    const fileName = file.split('/').at(-1)?.split('.')[0]

    if (excludeFiles.some((excludeFile) => file.endsWith(excludeFile))) {
      continue
    }

    if (!fileName) {
      continue
    }

    entries.set(`${fileName}`, fileURLToPath(new URL(file, import.meta.url)))
  }

  entries.set('index', fileURLToPath(new URL('src/index.js', import.meta.url)))

  const res = Object.fromEntries(entries)

  return res
}

const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

const toTitleCase = (str) => {
  return str.replace(/(?:^|-)([a-z])/g, (_, g) => g.toUpperCase())
}

export default defineConfig(({ mode }) => {
  const esm = {
    build: {
      minify: false,
      copyPublicDir: false,
      emptyOutDir: true,
      lib: {
        entry: createEntries(),
        name: toCamelCase(packageJson.name),
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: [...peerDependencies],
        output: {
          assetFileNames: '[name][extname]',
          entryFileNames: '[format]/[name].js',
        },
      },
    },
    plugins: [
      {
        name: 'copy-package-json-to-dist',
        writeBundle: {
          async handler() {
            const sourcePath = fileURLToPath(new URL('package.json', import.meta.url))
            const destinationPath = fileURLToPath(new URL('dist/package.json', import.meta.url))

            try {
              await fs.copyFile(sourcePath, destinationPath)
            } catch (err) {
              console.error('Error copying package.json:', err)
            }
          },
        },
      },
    ],
  }

  const umd = {
    build: {
      minify: false,
      copyPublicDir: false,
      emptyOutDir: false,
      lib: {
        entry: fileURLToPath(new URL('src/index.js', import.meta.url)),
        name: toTitleCase(packageJson.name),
        formats: ['umd'],
        fileName: () => `${toTitleCase(packageJson.name)}.umd.js`,
      },
      rollupOptions: {
        external: [...peerDependencies],
      },
    },
  }

  const playground = {
    plugins: [vue()],
    root: 'playground',
    base: `/${packageJson.name}/`,
    build: {
      outDir: '../docs',
      emptyOutDir: true,
    },
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  }

  if (mode === 'legacy') {
    return umd
  }

  if (mode === 'modern') {
    return esm
  }

  if (mode === 'playground') {
    return playground
  }

  return {
    test: {
      watch: true,
    },
  }
})
