class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handler) {
    const regex = this._patternToRegex(pattern);
    this.routes.push({ method: method.toUpperCase(), regex, handler });
    return this;
  }

  get(pattern, handler) { return this.add('GET', pattern, handler); }
  post(pattern, handler) { return this.add('POST', pattern, handler); }
  put(pattern, handler) { return this.add('PUT', pattern, handler); }
  patch(pattern, handler) { return this.add('PATCH', pattern, handler); }
  delete(pattern, handler) { return this.add('DELETE', pattern, handler); }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = route.regex.exec(pathname);
      if (match) {
        return { handler: route.handler, params: match.groups || {} };
      }
    }
    return null;
  }

  _patternToRegex(pattern) {
    const regexStr = pattern.replace(/:([a-zA-Z]+)/g, '(?<$1>[A-Za-z0-9\\-_]+)');
    return new RegExp(`^${regexStr}$`);
  }
}

module.exports = Router;
