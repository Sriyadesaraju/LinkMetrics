import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export const AIService = {
  async suggestUTMParams(url: string) {
    const prompt = `You are a digital marketing expert.
Given this URL: ${url}

Suggest UTM parameters for a typical marketing campaign.
Respond ONLY with a valid JSON object, no explanation, no markdown, no backticks:
{
  "source": "example: google",
  "medium": "example: cpc",
  "campaign": "example: summer-sale-2024",
  "content": "example: banner-top",
  "term": "example: running-shoes"
}

Make the values specific and relevant to the URL provided.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Strip markdown code blocks if model wraps in them
    const clean = text.replace(/```json|```/g, '').trim()

    try {
      return JSON.parse(clean)
    } catch {
      throw new Error('AI returned invalid JSON')
    }
  },

  async summarizeAnalytics(analyticsData: {
    totalClicks: number
    byCountry: { name: string; count: number }[]
    byDevice: { name: string; count: number }[]
    byBrowser: { name: string; count: number }[]
    byDay: { date: string; count: number }[]
  }) {
    const topCountry = analyticsData.byCountry[0]
    const topDevice = analyticsData.byDevice[0]
    const topBrowser = analyticsData.byBrowser[0]
    const peakDay = analyticsData.byDay.reduce(
      (max, d) => (d.count > max.count ? d : max),
      { date: 'N/A', count: 0 }
    )

    const prompt = `You are an analytics expert giving a brief performance summary.

Link analytics data (last 30 days):
- Total clicks: ${analyticsData.totalClicks}
- Top country: ${topCountry?.name ?? 'Unknown'} (${topCountry?.count ?? 0} clicks)
- Top device: ${topDevice?.name ?? 'Unknown'}
- Top browser: ${topBrowser?.name ?? 'Unknown'}
- Peak day: ${peakDay.date} with ${peakDay.count} clicks

Write exactly 2 sentences summarizing this link's performance.
Be specific with the numbers. Be direct. No fluff.
Do not start with "This link" — vary the opening.`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  },
}