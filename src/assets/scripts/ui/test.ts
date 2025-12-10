/*
import _isEmpty from 'lodash/isEmpty'

const Async = {
  generaterRun(iter) {
    return (function iterate({value, done}) {
      if (done) return value
      if (value.constructor === Promise) {
        return value.then((data) => iterate(iter.next(data))).catch((err) => iter.throw(err))
      } else {
        return iterate(iter.next(value))
      }
    })(iter.next())
  },
  wait(ms, value) {
    return new Promise((resolve) => setTimeout(resolve, ms, value))
  },
  promise(callback) {
    return new Promise((resolve, reject) => {
      callback(resolve, reject)
    })
  }
}
console.log('Async222', Async)

function* testEvent01() {
  try {
    const delay1 = yield Async.wait(2000, 'delay2초')
    console.log(delay1)

    const runVal2 = yield 'test2'
    console.log(runVal2)

    const delay2 = yield Async.wait(3000, 'delay3초')
    console.log(delay2)
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message)
    }
  }
}

Async.generaterRun(testEvent01())

console.log(Promise.resolve('test!!!!'))

class Test {
  constructor(txt) {
    this.txt = txt
  }

  showTxt() {
    return this.txt
  }
}
const testIns = new Test('문구 입니다!')
console.log(testIns.showTxt())

const bb = {
  as: 1,
  cs: 3
}
const cc = {
  cs: 2,
  ds: 5
}

const {as, cs} = bb

console.log(as, cs)

const Maa = {...bb, ...cc}

console.log(Maa)

console.log('_isEmpty', _isEmpty)

window.addEventListener('DOMContentLoaded', (event) => {
  console.log(jQuery)
})
*/

$(document).ready(function () {
  // Initialize Kendo Buttons
  if ($('#kendoButton').length) {
    $('#kendoButton').kendoButton({themeColor: 'primary', enable: true});
    $('#kendoPrimaryButton').kendoButton({icon: 'filter', size: 'large'});
    $('#kendoLargeButton').kendoButton({
      rounded: 'full', // none | small | medium | large | full
      fillMode: 'solid', // solid | outline | flat | link
      themeColor: 'primary' // base | primary | secondary | success | etc
    });
    $('#customSizedButton').kendoButton({size: 'small'});
  }
  // Kendo UI RadioButtons are typically styled via CSS classes ('k-radio', 'k-radio-label')
  // included in the themes. No specific JS initialization is required for basic rendering.
});
