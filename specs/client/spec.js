var expect = require('chai').expect;
var $ = require('jquery');
require('../../client/js/app.js');

describe('Basic test', function() {
  it('should have text', function() {
    expect('Hello, world!').to.equal('Hello, world!');
  });
});
