---
to: packages/<%= device %>/src/views/pages<%= path %>/<%= name %>.ejs
force: true
---

<<%= ejs %> const _src = srcPath; const _public = publicPath; <%= ejs %>>
<!DOCTYPE html>
<html lang="ko">
<<%= ejs %>- include(`${_src}/views/layout/head.ejs`, {meta_title: ''}) <%= ejs %>>
<body>
  <!-- // inlint style -->
  <style></style>

  <<%= ejs %>- include(`${_src}/views/layout/header.ejs`) <%= ejs %>>

  <!--// content(start)-->
  <%= name %>
  <!-- content(end) //-->

  <!-- src, public 이미지 가이드
  <img src="<<%= ejs %>= _src <%= ejs %>>/assets/images/img_list01.jpg" alt="src img"/>
  <img src="<<%= ejs %>= _public <%= ejs %>>/images/news_02.png" alt="public img" />
  -->


  <<%= ejs %>- include(`${_src}/views/layout/footer.ejs`) <%= ejs %>>
  <<%= ejs %>- include(`${_src}/views/layout/footer.links.ejs`) <%= ejs %>>

<script>
  // inlint scripts
</script>
</body>
</html>
