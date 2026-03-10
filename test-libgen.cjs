const cheerio = require('cheerio');
const url = 'https://libgen.li/index.php?req=dune&columns%5B%5D=t&columns%5B%5D=a&columns%5B%5D=s&columns%5B%5D=y&columns%5B%5D=p&columns%5B%5D=i&objects%5B%5D=f&objects%5B%5D=e&objects%5B%5D=s&objects%5B%5D=a&objects%5B%5D=p&objects%5B%5D=w&topics%5B%5D=l&topics%5B%5D=c&topics%5B%5D=f&topics%5B%5D=a&topics%5B%5D=m&topics%5B%5D=r&topics%5B%5D=s';
fetch(url).then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const rows = $('#tablelibgen tbody tr');
  const results = [];
  rows.each((i, el) => {
      const cols = $(el).find('td');
      if (cols.length >= 8) {
          const title = $(cols[0]).find('a').first().text().trim();
          const author = $(cols[1]).text().trim();
          const year = $(cols[3]).text().trim();
          const language = $(cols[4]).text().trim();
          const size = $(cols[6]).text().trim();
          const format = $(cols[7]).text().trim();
          const directLink = $(cols[8]).find('a').attr('href');
          if (title && directLink) {
              results.push({
                  title: title,
                  author: author,
                  year: year,
                  language: language,
                  format: format,
                  size: size,
                  directUrl: directLink.startsWith('http') ? directLink : 'https://libgen.li' + directLink
              });
          }
      }
  });
  console.log(results[0]);
});
