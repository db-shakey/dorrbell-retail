import { RetailerPortalPage } from './app.po';

describe('retailer-portal App', function() {
  let page: RetailerPortalPage;

  beforeEach(() => {
    page = new RetailerPortalPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
