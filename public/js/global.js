function timeSince(date) {
    const seconds = Math.floor(Date.now() - date.getTime());

    // >= 1 year
    if ((seconds / (365.25 * 24 * 60 * 60 * 1000)) > 1) return { num: Math.floor(seconds / (365.25 * 24 * 60 * 60 * 1000)), measurement: "y" };

    // >= 1 month
    if ((seconds / (30 * 24 * 60 * 60 * 1000)) > 1) return { num: Math.floor(seconds / (30 * 24 * 60 * 60 * 1000)), measurement: "mo" };

    // >= 1 week
    if ((seconds / (7 * 24 * 60 * 60 * 1000)) > 1) return { num: Math.floor(seconds / (7 * 24 * 60 * 60 * 1000)), measurement: "w" };

    // >= 1 day
    if ((seconds / (24 * 60 * 60 * 1000)) > 1) return { num: Math.floor(seconds / (24 * 60 * 60 * 1000)), measurement: "d" };

    // >= 1 hour
    if ((seconds / (60 * 60 * 1000)) > 1) return { num: Math.floor(seconds / (60 * 60 * 1000)), measurement: "h" };

    // >= 1 minute
    if ((seconds / (60 * 1000)) > 1) return { num: Math.floor(seconds / (60 * 1000)), measurement: "m" };

    return { num: Math.floor(seconds / 1000), measurement: "s" };
}

// Here begins mostly language stuff, unrelated to the actual functionality of the app.
function tsToTimestamp(ts) {
    if (language == "ru") {
        // boy here we go
        if (ts.measurement == "y") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} года назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} год назад`;
            return `${ts.num} лет назад`;
        }

        if (ts.measurement == "mo") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} месяца назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} месяц назад`;
            return `${ts.num} месяцев назад`;
        }

        if (ts.measurement == "w") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} недели назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} неделю назад`;
            return `${ts.num} недель назад`;
        }

        if (ts.measurement == "d") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} дня назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} день назад`;
            return `${ts.num} дней назад`;
        }

        if (ts.measurement == "h") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} часа назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} час назад`;
            return `${ts.num} часов назад`;
        }

        if (ts.measurement == "m") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} минуты назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} минуту назад`;
            return `${ts.num} минут назад`;
        }

        if (ts.measurement == "s") {
            if ((ts.num.toString().endsWith("2") || ts.num.toString().endsWith("3") || ts.num.toString().endsWith("4")) &&
                !(ts.num.toString().endsWith("12") || ts.num.toString().endsWith("13") || ts.num.toString().endsWith("14"))) return `${ts.num} секунды назад`;
            if (ts.num.toString().endsWith("1") && !ts.num.toString().endsWith("11")) return `${ts.num} секунду назад`;
            return `${ts.num} секунд назад`;
        }
    } else if (language == "ja") {
        const timeMeasurements = {
            "y": "年",
            "mo": "ヶ月",
            "w": "週間",
            "d": "日",
            "h": "時間",
            "m": "分",
            "s": "秒"
        }
        return `${ts.num} ${timeMeasurements[ts.measurement]}前`;
    } else { // English, or the currently selected language isn't translated
        const timeMeasurements = {
            "y": "year",
            "mo": "month",
            "w": "week",
            "d": "day",
            "h": "hour",
            "m": "minute",
            "s": "second"
        }
        return `${ts.num} ${timeMeasurements[ts.measurement]}${ts.num > 1 ? "s" : ""} ago`;
    }
}

function songsStr(songs) {
    if (language == "ru") {
        if ((songs.toString().endsWith("2") || songs.toString().endsWith("3") || songs.toString().endsWith("4")) &&
            !(songs.toString().endsWith("12") || songs.toString().endsWith("13") || songs.toString().endsWith("14"))) return `${songs} песни`;
        if (songs.toString().endsWith("1") && !songs.toString().endsWith("11")) return `${songs} песня`;
        return `${songs} песен`;
    } else if (language == "ja") {
        return `${songs} 曲`
    } else {
        return `${songs} ${songs > 1 ? "songs" : "song"}`;
    }
}

function getFullDate(date) {
    if (language == "ru") {
        const months = {
            0: "января",
            1: "февраля",
            2: "марта",
            3: "апреля",
            4: "мая",
            5: "июня",
            6: "июля",
            7: "августа",
            8: "сентября",
            9: "октября",
            10: "ноября",
            11: "декабря"
        }
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} г.`
    } else if (language == "ja") {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } else {
        const months = {
            0: "Jan",
            1: "Feb",
            2: "Mar",
            3: "Apr",
            4: "May",
            5: "Jun",
            6: "Jul",
            7: "Aug",
            8: "Sep",
            9: "Oct",
            10: "Nov",
            11: "Dec"
        }
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
}

function abbrCounter(num) {
    if (language == "ja") {
        if (num < 10000) return num;
        if (num >= 10000 && num <= 99999) return `${(num / 10000).toFixed(1)}万`;
        if (num >= 100000 && num <= 99999999) return `${Math.trunc(num / 10000)}万`;
        if (num >= 100000000 && num <= 999999999) return `${(num / 100000000).toFixed(1)}億`;
        return `${Math.trunc(num / 100000000)}億`;
    } else {
        if (num < 1000) return num;
        const measurements = language == "ru" ? {
            "k": " тыс.",
            "M": " млн.",
            "B": " млрд."
        } : {
            "k": "k",
            "M": "M",
            "B": "B"
        };

        if (num >= 1000 && num <= 999999) {
            const number = (num / 1000).toFixed(2);
            return language == "ru" ? number.toString().replace(".", ",") : number + measurements.k;
        }

        if (num >= 1000000 && num <= 999999999) {
            const number = (num / 1000000).toFixed(2);
            return language == "ru" ? number.toString().replace(".", ",") : number + measurements.M;
        }

        if (num >= 1000000000) {
            const number = (num / 1000000000).toFixed(2);
            return language == "ru" ? number.toString().replace(".", ",") : number + measurements.B;
        }
    }
}

function listensForm(num) {
    if (language == "ja") {
        return `${num} 回の再生`;
    } else if (language == "ru") {
        if ((num.toString().endsWith("2") || num.toString().endsWith("3") || num.toString().endsWith("4")) &&
            !(num.toString().endsWith("12") || num.toString().endsWith("13") || num.toString().endsWith("14"))) return `${num} прослушивания`;
        if (num.toString().endsWith("1") && !num.toString().endsWith("11")) return `${num} прослушивание`;
        return `${num} прослушиваний`;
    } else {
        return `${num} ${num > 1 ? "listens" : "listen"}`;
    }
}

function commentsForm(num){
    if (language == "ja") {
        return `${num} 件のコメント`;
    } else if (language == "ru") {
        if ((num.toString().endsWith("2") || num.toString().endsWith("3") || num.toString().endsWith("4")) &&
            !(num.toString().endsWith("12") || num.toString().endsWith("13") || num.toString().endsWith("14"))) return `${num} комментария`;
        if (num.toString().endsWith("1") && !num.toString().endsWith("11")) return `${num} комментарий`;
        return `${num} комментариев`;
    } else {
        return `${num} ${num > 1 ? "comments" : "comment"}`;
    }
}