# Funnel Chart

A funnel chart visualization app for Splunk which supports two types of charts: classic and hybrid. The hybrid type is inspired by [this article](https://smilganir.medium.com/funnel-chart-suggested-alternatives-f5411e3a60f5).

## Examples

```
| makeresults
| eval data=split("Landing Page,1000,100-Product Page,900,90-Add to Cart,500,50-Checkout,200,20-Purchase,150,15", "-")
| mvexpand data
| eval step=mvindex(split(data, ","), 0), count=mvindex(split(data, ","), 1), percent=mvindex(split(data, ","), 2)
| table step count percent
```

## Classic

![classic](/static/classic.png)

## Hybrid

![hybrid](/static/hybrid.png)

## License

[MIT License](LICENSE)
