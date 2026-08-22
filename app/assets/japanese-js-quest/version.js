(function (root, factory) {
  const version = factory()
  if (typeof module === 'object' && module.exports) module.exports = version
  else {
    root.JSQuestVersion = version
    const element = document.getElementById('app-version')
    if (element) element.textContent = 'v' + version
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'
  return '0.4.3'
})
