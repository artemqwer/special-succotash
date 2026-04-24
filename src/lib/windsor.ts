import axios from 'axios';

const BASE_URL = 'https://connectors.windsor.ai/google_ads';

export interface WindsorDataRow {
  date?: string;
  campaign?: string;
  clicks: number;
  impressions: number;
  spend: number;
  conversions: number;
  conversion_value: number;
  [key: string]: any;
}

export const fetchWindsorData = async (apiKey: string, dateFrom: string, dateTo: string, groupBy: 'date' | 'campaign' | 'date,campaign' = 'date') => {
  try {
    const fields = ['clicks', 'impressions', 'spend', 'conversions', 'conversion_value'];
    if (groupBy.includes('date')) fields.push('date');
    if (groupBy.includes('campaign')) fields.push('campaign');

    const response = await axios.get(BASE_URL, {
      params: {
        api_key: apiKey,
        date_from: dateFrom,
        date_to: dateTo,
        fields: fields.join(','),
        _renderer: 'json'
      }
    });

    return response.data.data as WindsorDataRow[];
  } catch (error) {
    console.error('Error fetching Windsor.ai data:', error);
    throw error;
  }
};
