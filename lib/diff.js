function markdeleteeted(n, o, diffObj) {
    var key

    for (key in o) {
        if (n[key] == null) {
            if (typeof n[key] == 'object') {
                markdeleteeted(n[key], o[key], diffObj)
            } else {
                diffObj || (diffObj = {})
                diffObj[key] = {type: 'delete'}
            }
        }
    }

    return diffObj
}

module.exports = function diff(n, o) {
    var diffObj,
        subDiffObj,
        key

    for (key in n) {
        if (o[key] !== n[key]) {
            if (typeof n[key] == 'object' && typeof o[key] == 'object') {
                subDiffObj = diff(n[key], o[key])
                if (subDiffObj) {
                    diffObj || (diffObj = {})
                    diffObj[key] = subDiffObj
                }
            } else {
                diffObj || (diffObj = {})
                diffObj[key] = {value: n[key]}
                diffObj[key].type = o[key] == null ? 'create' : 'update'
            }
        }
    }

    return markdeleteeted(n, o, diffObj)
}
