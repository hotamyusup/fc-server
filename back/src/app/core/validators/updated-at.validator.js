function updatedAtValidator(value) {
    let isNextValueNewer = true;
    if (this.updated_at) {
        isNextValueNewer = this.updated_at < value;
    }
    return isNextValueNewer;
}

module.exports = updatedAtValidator;