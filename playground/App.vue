<template>
  <div class="h-screen">
    <div class="flex flex-col px-10">
      <div class="mt-4">
        <h1 class="text-2xl font-bold">Excel Formula Utilities Playground</h1>
        <p class="text-lg mt-2">
          This is a playground for
          <a
            href="https://github.com/kouts/excel-formula-utilities"
            target="_blank"
            rel="noreferrer noopener"
            class="text-emerald-600"
          >
            excel-formula-utilities</a
          >, a set of functions to beautify and convert Excel formulas to JavaScript, C# and, Python.
        </p>
      </div>
      <div class="mt-4 w-full">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-5">
            <label class="block font-semibold mb-2">Formula</label>
            <textarea
              v-model="formula"
              class="w-full h-96 border border-gray-300 rounded p-2 outline-none focus:ring-emerald-600 focus:ring-2"
              placeholder="Enter your Excel formula here"
            ></textarea>
          </div>
          <div class="col-span-2">
            <label class="block font-semibold mb-2">Options</label>
            <div>
              <select
                v-model="selectedMode"
                class="w-full border bg-white border-gray-300 rounded p-2 focus:ring-emerald-600 focus:ring-2"
              >
                <option v-for="option in modes" :key="option.value" :value="option.value">{{ option.text }}</option>
              </select>

              <div class="flex items-center mt-4">
                <input
                  id="default-checkbox"
                  v-model="isEu"
                  type="checkbox"
                  class="w-4 h-4 border-gray-300 rounded outline-none focus:ring-emerald-600 focus:ring-2"
                />
                <label for="default-checkbox" class="ms-2 text-sm font-medium text-gray-900"> Use ; list as separator </label>
              </div>

              <div class="mt-4">
                <label class="block font-semibold mb-2">Number of indent spaces</label>
                <input
                  v-model="indentSpaces"
                  type="text"
                  class="w-full border border-gray-300 rounded p-2 focus:ring-emerald-600 focus:ring-2 outline-none"
                  @keypress="isNumber"
                />
              </div>
            </div>
          </div>
          <div class="col-span-5">
            <label class="block font-semibold mb-2">Result</label>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="border border-gray-300 rounded p-2 h-96 overflow-auto whitespace-nowrap formatted" v-html="res"></div>
          </div>
        </div>
      </div>
      <div class="flex justify-center my-8 border-t pt-4">
        <a
          href="https://github.com/kouts/excel-formula-utilities"
          target="_blank"
          rel="noreferrer noopener"
          class="inline-flex align-items-center text-decoration-none"
        >
          <svg width="24" height="24" viewBox="0 0 16 16" class="mx-2">
            <path
              fill-rule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            ></path>
          </svg>
          <div>GitHub</div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatFormulaHTML, formula2CSharp, formula2JavaScript, formula2Python } from '../src/index'

const modes = [
  { value: 'beautify', text: 'Beautify' },
  { value: 'minify', text: 'Minify' },
  { value: 'js', text: 'Formula to JavaScript' },
  { value: 'csharp', text: 'Formula to C#' },
  { value: 'python', text: 'Formula to Python' },
]
const formula = ref('=IF(SUM( IF(FOO = BAR, 10, 0), 10 ) = 20 , "FOO", "BAR")')
const selectedMode = ref('beautify')
const isEu = ref(false)
const indentSpaces = ref('2')

const sanitize = (str) => {
  return str.replace(/</gi, '&lt;').replace(/>/gi, '&gt;')
}

const isNumber = (event) => {
  if (!/\d/.test(event.key) && event.key !== '.') {
    return event.preventDefault()
  }
}

const res = computed(() => {
  const numberOfSpaces =
    !indentSpaces.value || typeof Number(indentSpaces.value) !== 'number' || isNaN(Number(indentSpaces.value))
      ? 2
      : Math.min(Number(indentSpaces.value), 10)

  // Options for formatting
  let nbsps = ''

  for (let l = 0; l < numberOfSpaces; l += 1) {
    nbsps += '&nbsp;'
  }
  const options = {
    tmplIndentTab: `<span class="tabbed">${nbsps}</span>`,
    isEu: isEu.value,
  }

  switch (selectedMode.value) {
    case 'beautify':
      return formatFormulaHTML(formula.value, options)
    case 'minify':
      return sanitize(formula.value.replace(/\s+/gi, ' '))
    case 'js':
      return sanitize(formula2JavaScript(formula.value))
    case 'csharp':
      return sanitize(formula2CSharp(formula.value))
    case 'python':
      return sanitize(formula2Python(formula.value))
  }

  return ''
})
</script>

<style lang="css">
.formatted {
  font-family: 'Courier New', Courier, 'Lucida Sans Typewriter', 'Lucida Typewriter', monospace;
}

.function {
  @apply text-sky-700;
}

.function_start,
.function_stop {
  @apply text-red-700;
}

.tabbed {
  @apply border-l border-dotted border-gray-400;
}

.quote_mark,
.text {
  @apply text-blue-700;
}
</style>
