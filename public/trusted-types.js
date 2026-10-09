if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy("default", {
    createScriptURL: function (value) {
      var url = new URL(value, document.baseURI);
      if (url.origin === location.origin && url.pathname.indexOf("/_next/static/") === 0) {
        return value;
      }
      throw new TypeError("Blocked script URL: " + value);
    },
  });
}
