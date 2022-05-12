robVeg();

function robVeg() {
    console.show(true);
    submitOrder();
}


function submitOrder() {
    var fast = false;
    var fastFailMax = 0;
    var fastFail = 0;

    var retry = false;
    var idle = 0;

    var fail = 0;

    var init = true;
    if (init) {
        fastFailMax = 20;
    }

    while(true) {
        if (fail > 20000) {
            console.warn("没抢到");
            exit();
        }
        if (fastFail > fastFailMax) {
            fastFail = 0;
            fast = false;
            if (init) {
                init = false;
                console.warn("开始自动模式");
            } else {
                console.warn("抢购失败太多，开始捡漏模式");
            }
        }
        if (!fast) {
            var date = new Date();
            var hour = date.getHours();
            var minute = date.getMinutes();
            if (((hour == 6) && (minute == 10)) || ((hour == 7) && (minute == 59))) {
                fast = true;
                fastFailMax = 1000;
                console.warn("开始抢购模式");
            }
        }

        var btn = textContains("去结算").findOnce();
        if ((btn != null) && (btn.clickable())) {
            btn.click();
            retry = true;
            idle = 0;
            if (init || fast) {
                console.info("点击去结算");
                sleep(100);
            } else {
                console.verbose("点击去结算");
                sleep(1000);
            }
            continue;
        }

        var btn = textContains("确定").findOnce();
        if (textContains("数据加载失败").exists() && (btn != null)) {
            btn.click();
            console.info("加载失败，点击确定");
            sleep(100);
            continue;
        }
        if (textContains("配送运力已满").exists() && (btn != null)) {
            btn.click();
            console.info("运力已满，点击确定");
            sleep(100);
            continue;
        }

        if (textContains("当前商品运力不足").exists() || textContains("下单失败").exists()) {
            back();
            fail++;
            if (init || fast) {
                fastFail++;
                console.info("运力不足，后退");
                sleep(100);
            } else {
                console.verbose("运力不足，后退");
                sleep(10000);
            }
            continue;
        }

        if (textContains("库存不足了").exists()) {
            console.error("库存不足，停止抢菜");
            exit();
        }

        var btn = id("widget_trade_sendtime_select_text").textContains("选择时间").findOnce();
        if (btn != null) {
            fast = true;
            fastFailMax = 200;
            btn.parent().click();
            console.info("点击选择时间");
            sleep(50);
            continue;
        }

        var timeArea = idContains("wv_period").findOnce();
        var btn = textContains("确定").findOnce();
        if (btn == null) {
            btn = textContains("完成").findOnce();
        }
        if ((timeArea != null) && (btn != null)) {
            var items = timeArea.children();
            var available = items.filter(function (item) {
                return item.findOne(textContains("已约满")) == null;
            });
            var select = available[random(0, available.length - 1)];
            var time = select.findOne(textContains("送达"));
            var b = time.bounds();
            click(b.centerX(), b.centerY());
            sleep(10);
            btn.click();
            console.info("共" + available.length + "个，选择：" + time.text());
            sleep(100);
            continue;
        }

        var btn = textContains("提交订单").findOnce();
        if ((btn != null) && id("widget_trade_sendtime_select_text").textContains("送达").exists()) {
            btn.click();
            console.info("点击提交订单");
            //exit();
        }

        if (init || fast) {
            sleep(100);
        } else {
            sleep(1000);
        }
        console.verbose("空闲");

        if (!init && retry) {
            idle++;
            if ((fast && (idle > 20)) || (!fast && (idle > 2))) {
                retry = false;
                btn.click();
                console.info("超时，返回");
                sleep(100);
            }
        }
    }
}
