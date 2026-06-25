import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import ws from 'ws';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://wedding-cy3.pages.dev',
    /\.pages\.dev$/,
    /\.railway\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { realtime: { transport: ws } }
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WEDDING_SYSTEM_PROMPT = `คุณคือผู้ช่วย AI สำหรับงานแต่งงานของ กานต์พิชชา และ ณัฐพล
ข้อมูลงาน:
- วันที่: 11 พฤศจิกายน 2571 (11/11/2028)
- สถานที่: จังหวัดน่าน
- งานเช้า: 09:00-12:00 น.
- งานเย็น: 18:00-22:00 น.
ตอบภาษาไทยอย่างอบอุ่นและเป็นกันเอง ให้ข้อมูลที่ถูกต้องเกี่ยวกับงาน`;

const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// POST /api/rsvp
app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, phone, guests, session, dietary, message } = req.body;
    if (!name) return res.status(400).json({ error: 'กรุณากรอกชื่อ' });

    const { error } = await supabase.from('rsvp').insert({
      name,
      phone: phone || '',
      guests: parseInt(guests) || 1,
      session: session || 'morning',
      dietary: dietary || '',
      message: message || '',
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    let thankYouMsg = `ขอบคุณมากเลยนะคะ คุณ${name} 🌸 ดีใจมากที่จะได้พบกันในวันที่ 11.11.2028 ที่จังหวัดน่านค่ะ`;
    try {
      const aiResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: WEDDING_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `แขกชื่อ ${name} ยืนยันเข้าร่วมงาน${session === 'morning' ? 'เช้า' : session === 'evening' ? 'เย็น' : 'ทั้งสองช่วง'} จำนวน ${guests || 1} ท่าน${message ? ` และฝากข้อความว่า: ${message}` : ''} กรุณาตอบขอบคุณอย่างอบอุ่น`,
          },
        ],
      });
      thankYouMsg = aiResponse.content[0].text;
    } catch (aiErr) {
      console.warn('Claude API unavailable, using default message:', aiErr.message);
    }

    res.json({ success: true, message: thankYouMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/rsvp/summary
app.get('/api/rsvp/summary', async (req, res) => {
  try {
    const { data, error } = await supabase.from('rsvp').select('session, guests');
    if (error) throw error;

    const total = data.length;
    const morning = data.filter(r => r.session === 'morning').length;
    const evening = data.filter(r => r.session === 'evening').length;
    const both = data.filter(r => r.session === 'both').length;
    const totalGuests = data.reduce((sum, r) => sum + (r.guests || 1), 0);

    res.json({ total, morning, evening, both, totalGuests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/rsvp (admin)
app.get('/api/rsvp', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rsvp')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/rsvp/:id (admin)
app.delete('/api/rsvp/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('rsvp').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages' });
    }

    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: WEDDING_SYSTEM_PROMPT,
      messages,
    });

    res.json({ reply: aiResponse.content[0].text });
  } catch (err) {
    console.error('Chat error:', err.status, err.message);
    res.json({ reply: 'ขออภัยนะคะ ขณะนี้ระบบ AI ยังไม่พร้อมใช้งาน หากมีคำถามเกี่ยวกับงาน กรุณาติดต่อเจ้าบ่าวเจ้าสาวโดยตรงค่ะ 🌸' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
