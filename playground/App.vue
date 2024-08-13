<template>
  <div class="h-screen">
    <div class="container mx-auto">
      <div class="mt-4">
        <h1 class="text-2xl font-bold">Excel Formula Utilities Playground</h1>
        <p class="text-lg mt-2">
          This is a playground for Excel Formula Utilities, a set of functions to beautify and convert Excel formulas to
          JavaScript, C# and, Python.
        </p>
      </div>
      <div class="mt-4">
        <div class="grid lg:grid-cols-[40%_20%_40%] grid-cols-1 gap-4">
          <div>
            <label class="block font-semibold mb-2">Formula</label>
            <textarea
              v-model="formula"
              class="w-full h-96 border border-gray-300 rounded p-2"
              placeholder="Enter your Excel formula here"
            ></textarea>
          </div>
          <div>
            <label class="block font-semibold mb-2">Options</label>
            <div>
              <select v-model="selectedMode" class="w-full border bg-white border-gray-300 rounded p-2">
                <option v-for="option in modes" :key="option.value" :value="option.value">{{ option.text }}</option>
              </select>

              <div class="flex items-center mt-4">
                <input
                  id="default-checkbox"
                  v-model="isEu"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label for="default-checkbox" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Use ; list as separator
                </label>
              </div>

              <div class="mt-4">
                <label class="block font-semibold mb-2">Number of indent spaces</label>
                <input
                  v-model="indentSpaces"
                  type="text"
                  onkeypress="return /[0-9]/i.test(event.key)"
                  class="w-full border border-gray-300 rounded p-2"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block font-semibold mb-2">Result</label>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="border border-gray-300 rounded p-2 h-96 overflow-auto whitespace-nowrap formatted" v-html="res"></div>
          </div>
        </div>
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
