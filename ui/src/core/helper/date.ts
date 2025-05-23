const intlDateTime = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
});

export function formatDateTime(date: Date | string | number, options = {
    local: false,
    time: true,
    milliseconds: true,
    utc: false
}) {
    if (date == null || date == '') {
        return ''
    }

    if (!(date instanceof Date)) {
        date = new Date(date)
    }

    if (options.local) {
        return intlDateTime.format(date as Date).replace(',', '')
    }

    var d = (date as Date)
    var dt = options.utc
        ? d.toISOString()
        : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()

    if (options.time != true) {
        return dt.substring(0, 10)
    }

    if (options.milliseconds != true) {
        return dt.substring(0, 19).replace('T', ' ')
    }

    return dt.replace('T', ' ').replace('Z', '')
}