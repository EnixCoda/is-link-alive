# Check URL

This tool helps to check if a URL is available via Node.JS or Browser(puppeteer).

## Usage
Save the URLs to be checked into a file, take `urls.txt` for example.

`urls.txt`:
```
bing.com
google.com/url?q=test
```

Then run
```bash
$ yarn start urls.txt output.csv
```

JSON output is also supported.

```bash
$ yarn start urls.txt output.json
```
