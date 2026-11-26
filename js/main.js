// 浙江越鑫检测 官网脚本
// 说明：不依赖任何第三方库。即使本脚本加载失败，页面内容也会正常显示（动画只是锦上添花）。
(function () {
    'use strict';

    var header = document.querySelector('header');
    var nav = document.querySelector('nav');
    var menuBtn = document.querySelector('.mobile-menu-btn');
    var navLinks = document.querySelectorAll('nav ul li a');
    var sections = document.querySelectorAll('section[id]');
    var isMobile = function () { return window.innerWidth <= 768; };

    // 页脚年份自动更新
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ---------- 进入视口时的淡入动画（替代原 AOS 库） ----------
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animated = document.querySelectorAll('[data-aos]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        document.documentElement.classList.add('anim-ready');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var delay = parseInt(el.getAttribute('data-aos-delay') || '0', 10);
                el.style.transitionDelay = delay + 'ms';
                el.classList.add('aos-animate');
                io.unobserve(el);
                // 动画结束后移除标记，让卡片恢复自己原本的悬停效果
                setTimeout(function () {
                    el.removeAttribute('data-aos');
                    el.classList.remove('aos-animate');
                    el.style.transitionDelay = '';
                }, delay + 900);
            });
        }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
        animated.forEach(function (el) { io.observe(el); });
    }

    // ---------- 移动端菜单 ----------
    function closeMenu() {
        if (!menuBtn) return;
        menuBtn.classList.remove('active');
        nav.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', '打开菜单');
    }
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = !nav.classList.contains('active');
            menuBtn.classList.toggle('active', open);
            nav.classList.toggle('active', open);
            menuBtn.setAttribute('aria-expanded', String(open));
            menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
        });
        document.addEventListener('click', function (e) {
            if (isMobile() && !nav.contains(e.target)) closeMenu();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ---------- 导航平滑滚动 ----------
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 70, behavior: reduceMotion ? 'auto' : 'smooth' });
            closeMenu();
        });
    });

    // ---------- 滚动：导航高亮 + 顶栏阴影（合并为一个节流处理） ----------
    var ticking = false;
    function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        var current = '';
        sections.forEach(function (s) {
            if (y >= s.offsetTop - 150) current = s.id;
        });
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
        if (header) header.classList.toggle('scrolled', y > 100);
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();

    // ---------- 业绩展示轮播 ----------
    var track = document.querySelector('.achievements-track');
    var slider = document.querySelector('.achievements-slider');
    var cards = document.querySelectorAll('.achievement-card');
    var prevBtn = document.querySelector('.prev-btn');
    var nextBtn = document.querySelector('.next-btn');

    if (track && slider && cards.length) {
        var page = 0;
        var step = 0;
        var timer = null;
        var resumeTimer = null;
        var AUTOPLAY = 5000;
        var RESUME_AFTER = 4000;

        var perPage = function () {
            var w = window.innerWidth;
            return w <= 768 ? 1 : (w <= 1200 ? 2 : 3);
        };
        var pageCount = function () { return Math.ceil(cards.length / perPage()); };

        function measure() {
            var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || (isMobile() ? 20 : 30);
            step = cards[0].getBoundingClientRect().width + gap;
        }

        function buildDots() {
            var old = slider.querySelector('.slider-indicators');
            if (old) old.remove();
            var wrap = document.createElement('div');
            wrap.className = 'slider-indicators';
            for (var i = 0; i < pageCount(); i++) {
                (function (n) {
                    var dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'indicator';
                    dot.setAttribute('aria-label', '第 ' + (n + 1) + ' 页');
                    dot.addEventListener('click', function () { go(n); pauseThenResume(); });
                    wrap.appendChild(dot);
                })(i);
            }
            slider.appendChild(wrap);
        }

        function render() {
            var max = pageCount();
            if (page > max - 1) page = max - 1;
            if (page < 0) page = 0;
            track.style.transform = 'translateX(-' + (page * perPage() * step) + 'px)';
            if (prevBtn) prevBtn.classList.toggle('disabled', page === 0);
            if (nextBtn) nextBtn.classList.toggle('disabled', page === max - 1);
            slider.querySelectorAll('.indicator').forEach(function (d, i) {
                d.classList.toggle('active', i === page);
            });
        }

        function go(n) { page = n; render(); }

        function stop() {
            clearInterval(timer); timer = null;
            clearTimeout(resumeTimer); resumeTimer = null;
        }
        function start() {
            stop();
            if (reduceMotion) return;
            timer = setInterval(function () {
                go(page < pageCount() - 1 ? page + 1 : 0);
            }, AUTOPLAY);
        }
        function pauseThenResume() {
            stop();
            resumeTimer = setTimeout(start, RESUME_AFTER);
        }

        function setup() {
            measure();
            buildDots();
            render();
        }

        if (prevBtn) prevBtn.addEventListener('click', function () {
            if (page > 0) { go(page - 1); pauseThenResume(); }
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            if (page < pageCount() - 1) { go(page + 1); pauseThenResume(); }
        });

        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);

        var startX = 0;
        track.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            stop();
        }, { passive: true });
        track.addEventListener('touchend', function (e) {
            var diff = e.changedTouches[0].clientX - startX;
            if (diff > 50 && page > 0) go(page - 1);
            else if (diff < -50 && page < pageCount() - 1) go(page + 1);
            pauseThenResume();
        }, { passive: true });

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setup, 150);
        });

        // 页面不可见时暂停自动播放，省电
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop(); else start();
        });

        if (document.readyState === 'complete') { setup(); start(); }
        else window.addEventListener('load', function () { setup(); start(); });
        setup();
    }
})();
