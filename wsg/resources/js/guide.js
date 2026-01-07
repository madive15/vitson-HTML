var gCom = {
	init : function(){
		//console.log('gCom.init()');
		this.gHeader.init();
		this.gAside.init();
		this.gResponsive.init();
	},
	gHeader : {
		headerEl : 'js-wsg-header-wrapper',
		init : function(){
			//this.setInit();
			this.setSnbInit();
		},
		setInit : function(){
			var path = location.pathname;
			var snbMenu = 'wsg-snbMenu0';
			var activeEl = null;
			$('.wsg-lnb a').each(function(i){
				if (path.indexOf($(this).attr('data-url')) > -1){
					activeEl = $(this);
					activeEl.parent().addClass('is-current');
					snbMenu = activeEl.attr('data-aside');
					$('.'+snbMenu).show().siblings().not(':visible').remove();
				}
				else if ($('.wsg-lnb a').length - 1 == i){
					if (activeEl == null){
						$('.'+snbMenu).show().siblings().not(':visible').remove();
					}
				}


				return;
			});
		},
		setSnbInit : function(){//lnb focus
			var path = location.pathname;
			var activeEl = null;
			var pageUrl = path.split("/")[path.split("/").length-1];
			var tgUrl = "";

			$('.wsg-snb .wsg-node2').removeClass('is-current');
			$('.wsg-snb .wsg-node2 > a').each(function(i){
				tgUrl = $(this).attr("href").split("/")[$(this).attr("href").split("/").length-1];

				if (tgUrl == pageUrl){
					$(this).parent().addClass('is-current');
				}
				return;
			});

			var papa = $('.wsg-snb .wsg-node2.is-current');
			var el = $("<ul class='wsg-node3'>");
			$('.wsg-content-body .wsg-section').each(function(i){
				// el.append("<li><a href='#"+$(this).attr("id")+"'>"+$(this).find('.wsg-h2').html()+"</li>");
				el.append("<li><a href='javascript:;' data-target="+$(this).attr('id')+" >"+$(this).find('.wsg-h2').html()+"</li>");
			});
			papa.append (el);

			papa.find(".wsg-node3").find("a").bind("click", function(){
				var yy = $('.wsg-content-body').find('#'+$(this).data("target")).offset().top - 80;
				$(window).scrollTop(yy);
				return false;
			})
		}
	},
	gAside : {
		asideEl : '.js-wsg-aside',
		anbBtnEl : '.btn-aside',
		maskEl : '.g-mask',
		asideWid : null,
		init : function(){
			if (location.hash != ''){
				gUI.spyScroll.action(location.hash);
			}

			this.asideWid = $(this.asideEl).width();
			this.setInit();
			this.event();

		},
		setInit : function(){
			var _this = this;
			var path = location.pathname;
			$(this.asideEl).find('.wsg-snb a[href*="'+path+'"]').parent().addClass('is-current');
		},
		event : function(){
			$('body').addClass('is-aside-opened');
			//펼치기
			$(this.anbBtnEl).off('click').on('click', function(e){

				if (!$('body').hasClass('is-aside-closed')){
					$('body').removeClass('is-aside-opened');
					$('body').addClass('is-aside-closed');
				} else {
					$('body').addClass('is-aside-opened');
					$('body').removeClass('is-aside-closed');
				}
			}).addClass('is-clickEvent');

			//숨기기
			$(this.maskEl).not('.is-clickEvent').on('click', function(e){
				$('body').removeClass('is-aside-opened').addClass('is-aside-closed');
			}).addClass('is-clickEvent');
		},
	},
	gResponsive : {
		asideW : $('.js-wsg-aside').width(),
		init : function(){
			this.action();
			this.event();


		},
		event : function(){
			var _this = this;
			var time = null;
			$(window).on('resize', function(){
				clearTimeout(time);
				time = setTimeout(function(){
					_this.action();
				},300);
			})
		},
		action : function(){
			//Set is-responsive-md
			if ($(window).width() > 719 && $(window).width() < 1024 && !$('body').hasClass('is-responsive-md')){
				$('body').addClass('is-responsive-md');
			} else if ($(window).width() > 1023 && $('body').hasClass('is-responsive-md')){
				$('body').removeClass('is-responsive-md');
			}

			//Set is-responsive-sm
			if ($(window).width() < 720 && !$('body').hasClass('is-responsive-sm')){
				$('body').addClass('is-responsive-sm');
				$('body').removeClass('is-responsive-md');
				if ($('.wsg-lnb > .g-node-title').length == 0){
					var noteTitle = $('.wsg-lnb > ul > li.is-current > a').text();
					$('.wsg-lnb > ul').before('<button type="button" class="g-node-title"></button>');
					$('.wsg-lnb > .g-node-title').text(noteTitle);

					//Event
					$('.g-node-title').on('click', function(){
						$(this).parent().toggleClass('is-visible');
					})
				}
			} else if ($(window).width() > 719 && $('body').hasClass('is-responsive-sm')){
				$('body').removeClass('is-responsive-sm');
				$('body').addClass('is-responsive-md');
				$('.wsg-lnb > .g-node-title').remove();
			}

			//Set is-aside-closed
			if ($(window).width() < 1024 && !$('body').hasClass('is-aside-closed') && !$('body').hasClass('is-aside-opened')){
				$('body').addClass('is-aside-closed');
			} else if ($(window).width() > 1023 && $('body').hasClass('is-aside-closed')){
				$('body').removeClass('is-aside-closed');
			}


			if ( $(window).width() < 720 && $('body').hasClass('is-aside-opened') ){
				$('body').removeClass('is-aside-opened');
				$('body').addClass('is-aside-closed');
			}
		}
	}
}

var gUI = {
	init : function(){

		if ($('.g-js-scroll').length){
			this.mScroll.init();
		}
		if ($('[data-role=spy-scroll]').length){
			this.spyScroll.init();
		}
		if ($('.wsg-tab-codeview').length){
			this.tabCodeview.init();
		}
		if ($('.wsg-example-wrap').length){
			this.example.init();
		}
		if ($('.js-follow').length){
			this.followActive.init();
		}
		if ($('.wsg-example-copy').length){
			//ut.setScriptLoader(gRootURL.root+'_wsg/common/js/addon/jquery.clipboard.min.js', 'clipboardScript');
			//this.copyed.init();
		}
	},
	mScroll : {
		scrollEl : '.g-js-scroll',
		init : function(){
			$(this.scrollEl).each(function(){
				$(this).mCustomScrollbar({scrollInertia:200});
			})
		}
	},
	spyScroll : {
		init : function(){
			var _this = this;
			var id = null;
			$('[data-role=spy-scroll]').on('click', function(){
				if ($(this).attr('href').indexOf('#') > -1){
					id = '#' + $(this).attr('href').split('#')[1];
				} else {
					id = $(this).attr('href');
				}

				_this.action(id);
			})
		},
		action : function(id){
			var topH = $('#wsg-header-wrapper').height();
			var gapH = 30;
			var scrObj = 'html, body';
			if ($(id).length){
				$(scrObj).stop().animate({scrollTop:$(id).offset().top - topH - gapH}, 500);
			}
		},
	},
	tabCodeview : {
		tabNav : '.g-tab',
		tabLink : '.wsg-tab-codeview .wsg-tab-nav a',
		target : null,

		init : function(){
			if ($(this.tabNav).length > 0){
				this.event();
			}
		},
		event : function(){
			//현재페이지의 탭 활성화
			$(this.tabLink).on('click', function(){
				gUI.tabCodeview.action($(this));return false;
			});
		},
		action : function($this){
			this.target = $this.attr('href');
			if ($this.parent().is('.is-active')){
				$this.parent().removeClass('is-active');
				$(this.target).removeClass('is-active');
			} else {
				$this.parent().addClass('is-active').siblings().removeClass('is-active');
				$(this.target).addClass('is-active').siblings().removeClass('is-active');
			}
		}
	},
	example : {
		headerEl : '.wsg-example-header',
		btnEl : '.wsg-example-btn',
		target : null,

		init : function(){
			this.event();
		},
		event : function(){
			//현재페이지의 탭 활성화
			$(this.btnEl).on('click', function(){
				gUI.example.action($(this));return false;
			});
		},
		action : function($this){
			this.target = $this.attr('href');
			if ($this.is('.is-active')){
				$this.removeClass('is-active');
				$(this.target).removeClass('is-active');
			} else {
				$this.addClass('is-active').siblings().removeClass('is-active');
				$(this.target).addClass('is-active').siblings().removeClass('is-active');
			}
		}
	},
	copyed : {
		elWrap : '.wsg-example-wrap',
		elCopy : '.wsg-example-copy',
		elTarget : '.wsg-example-body',
		init : function(){
			this.reset();
		},
		reset : function(){
			var _this = this;
			var lenCopy = $(_this.elCopy).length;
			$(_this.elCopy).each(function(i){
				var targetHTML = $(this).closest(_this.elWrap).find(_this.elTarget).html();
				$(this).attr('data-clipboard-text', targetHTML);
				if (i == lenCopy-1){
					//_this.action();
				}
			})
		},
		action : function(){
			var clipboard = new Clipboard($(this.elCopy));
		}
	}
}
$(document).ready(function(){
	gCom.init();
	gUI.init();
})
