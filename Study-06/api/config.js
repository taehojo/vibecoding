/**
 * Vercel Serverless Function for Supabase Configuration
 * Returns Supabase URL and API key from environment variables
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get Supabase credentials from environment
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Supabase credentials not configured');
            return res.status(500).json({ error: 'Supabase가 설정되지 않았습니다.' });
        }

        return res.status(200).json({
            success: true,
            supabaseUrl,
            supabaseAnonKey
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: '서버 오류가 발생했습니다.',
            message: error.message
        });
    }
}
