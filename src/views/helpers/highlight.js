function highlight(text, keyword) {
  if (!keyword) return text;
  var parts = text.split(keyword);
  if (parts.length === 1) return text;
  return parts.join('<em>' + keyword + '</em>');
}

module.exports = highlight;
