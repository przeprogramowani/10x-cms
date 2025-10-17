/**
 * Utility Functions Module
 * Common utility functions used across the application
 */
(function (window) {
  "use strict";

  /**
   * Parse item data from string or object
   * @param {string|object} data - The data to parse
   * @returns {object} Parsed data object
   */
  function parseItemData(data) {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing item data:", e);
        return {};
      }
    }
    return data || {};
  }

  /**
   * Check if a value is a media path
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a media path
   */
  function isMediaPath(value) {
    var valueStr = String(value || "");
    return (
      valueStr &&
      (valueStr.indexOf("/uploads/") === 0 ||
        valueStr.indexOf("/public/uploads/") === 0)
    );
  }

  /**
   * Get table headers as an array
   * @param {jQuery} $table - The table element
   * @returns {Array<string>} Array of header names
   */
  function getTableHeaders($table) {
    var headers = [];
    $table.find("thead th").each(function (index, th) {
      var headerText = $(th).text();
      // Skip the Actions column (usually last)
      if (headerText !== "Actions") {
        headers.push(headerText);
      }
    });
    return headers;
  }

  /**
   * Extract collection ID from HTML meta tag
   * @returns {string|null} Collection ID or null
   */
  function getCollectionIdFromMeta() {
    var htmlContent = $("body").html();
    var metaTagMatch = htmlContent.match(/<!-- @collectionId:([^>]+) -->/);

    if (metaTagMatch && metaTagMatch[1]) {
      return metaTagMatch[1];
    }

    // Fallback to URL
    return window.location.pathname.split("/").pop();
  }

  /**
   * Create an HTML element with attributes
   * @param {string} tag - HTML tag name
   * @param {object} attrs - Attributes object
   * @param {string} content - Inner content
   * @returns {string} HTML string
   */
  function createElement(tag, attrs, content) {
    var html = "<" + tag;
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        html += " " + key + '="' + attrs[key] + '"';
      }
    }
    html += ">" + (content || "") + "</" + tag + ">";
    return html;
  }

  /**
   * Show/hide a loading indicator
   * @param {boolean} show - Whether to show or hide the loader
   */
  function toggleLoader(show) {
    if (show) {
      $("#fullPageLoader").removeClass("d-none");
    } else {
      $("#fullPageLoader").addClass("d-none");
    }
  }

  /**
   * Check if modal should auto-open based on URL params
   * @param {string} actionName - The action name to check for
   * @returns {boolean} True if the action matches
   */
  function shouldAutoOpenModal(actionName) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("action") === actionName;
  }

  // Export to window
  window.Utils = {
    parseItemData: parseItemData,
    isMediaPath: isMediaPath,
    getTableHeaders: getTableHeaders,
    getCollectionIdFromMeta: getCollectionIdFromMeta,
    createElement: createElement,
    toggleLoader: toggleLoader,
    shouldAutoOpenModal: shouldAutoOpenModal,
  };
})(window);
