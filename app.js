const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

async function scrapeAmazonProductImages(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            },
        });

        const $ = cheerio.load(data);

        const images = [];
        const reviewImages = [];

        $('script').each((index, element) => {
            const scriptContent = $(element).html();
            if (scriptContent && scriptContent.includes('ImageBlockATF')) {
                const matches = scriptContent.match(/"hiRes":"(https:[^"]+)"/g);
                if (matches) {
                    matches.forEach((match) => {
                        const imageUrl = match.match(/"hiRes":"(https:[^"]+)"/);
                        if (imageUrl && imageUrl[1]) {
                            images.push(imageUrl[1]);
                        }
                    });
                }
            }
        });


        $('picture source').each((index, element) => {
            const srcset = $(element).attr('srcset');
            if (srcset) {
                const imageUrls = srcset.split(/,\s*(?=[^"]*(?:"[^"]*"[^"]*)*$)/).map(url => url.trim().split(' ')[0]);
                imageUrls.forEach(url => {
                    if (url) {
                        reviewImages.push(url);
                    }
                });
            }
        });

        const imagesReview = [];

        for (let i = 0; i < reviewImages.length; i += 4) {
            const grupo = reviewImages.slice(i, i + 4).join(',');
            imagesReview.push(grupo);
        }

        function extractImageId(imageUrl) {
            const startIndex = imageUrl.lastIndexOf('/I/') + 3;
            const endIndex = imageUrl.indexOf('.', startIndex);
            return imageUrl.substring(startIndex, endIndex);
        }

        const uniqueImages = [];
        const seenIds = new Set();

        for (let i = imagesReview.length - 1; i >= 0; i--) {
            const imageUrl = imagesReview[i];
            const imageId = extractImageId(imageUrl);

            if (!seenIds.has(imageId)) {
                uniqueImages.unshift(imageUrl);
                seenIds.add(imageId);
            }
        }

        const productName = $('#productTitle').text().trim();
        const productDescription = $('#productDescription').text().trim() || $('meta[name="description"]').attr('content');

        return { images, imagesRev: uniqueImages, productName, productDescription };
    } catch (error) {
        console.error('Error scraping the URL:', error.message);
        return { error: 'Failed to scrape the URL. Ensure it is valid and publicly accessible.' };
    }
}

const generateProductData = async (productName, productDescription, images, imagesRev) => {
    const prompt = `
  Toma en cuenta el siguiente producto:
  - Nombre: ${productName}
  - Descripción: ${productDescription}
  - Imágenes: ${images.join(', ')}
  - Imágenes de reseñas: ${imagesRev.join(', ')}
  
  Genera un objeto JSON en español de mexico con la siguiente estructura:
  {
    "rating": { "stars": 4.5, "reviews": 1200, "text": "Texto de ejemplo" },
    "title": { "first": "Texto1", "second": "Texto2" },
    "product": { "name": "Nombre", "image": "URL de imagen", "trapText": "Texto corto" },
    "bottom": { "solution": "Texto", "ideal": "Texto" },
    "features": [{ "title": "Título", "description": "Descripción" }],
    "priceBox": { "header": "Texto", "discount": "Texto", "originalPrice": "Texto", "newPrice": "Texto" },
    "order": { "offer": "Texto", "stock": "Texto" },
    "efficiency": { "percentage": "Texto", "comparison": "Texto", "description": "Texto", "image": "URL de imagen" },
    "negative": { "percentage": "Texto", "comparison": "Texto", "description": "Texto", "image": "URL de imagen" },
    "negativeFeatures": [{ "title": "Título", "description": "Descripción" }],
    "featuresDark": {
      "title": { "main": "Texto", "highlight": "Texto" },
      "description": "Texto",
      "features": [{ "icon": "Emoji", "text": "Texto" }]
    },
    "reviews": {
      "ratingDistribution": [{ "stars": 5, "count": 900 }],
      "userReviews": [{ "name": "Nombre", "rating": 5, "verified": true, "comment": "Comentario", "image": "URL de imagen" }]
    },
    "faq": {
      "items": [{ "question": "Pregunta", "answer": "Respuesta" }]
    }
  }
  
  Es muy importante que se respete la estructura del objeto (cantidad de claves y valores) y que el largo de los valores sean similares a los siguientes:

  Objeto de ejemplo:



{
    "rating": {
        "stars": 4.5,
        "reviews": 1200,
        "text": "Basado en más de 1200 opiniones verificadas"
    },
    "title": {
        "first": "Piel mas bronceada",
        "second": "con o sin sol"
    },
    "product": {
        "name": "NUTRICOSMÉTICO",
        "image": "assets/images/imagen1.jpeg",
        "trapText": "Vitaminas, aminoacidos, antioxidantes y carotenoides."
    },
    "bottom": {
        "solution": "¡La solución ideal para un bronceado perfecto y saludable!",
        "ideal": "Ideal para todo tipo de piel"
    },
    "features": [
        {
            "title": "BRONCEADO RÁPIDO",
            "description": "Resultados visibles en solo 7 días de uso continuado"
        },
        {
            "title": "MÁXIMA SEGURIDAD",
            "description": "Formulación segura, sin exposición al sol"
        },
        {
            "title": "FÓRMULA NATURAL",
            "description": "Bronceado a base de ingredientes naturales"
        },
        {
            "title": "FÁCIL DE USAR",
            "description": "Solo una pastilla diaria para un bronceado uniforme"
        }
    ],
    "priceBox": {
        "header": "¡Hacé tu compra ahora y obtené un bronceado natural!",
        "discount": "¡50% DE DESCUENTO!",
        "originalPrice": "$415 pesos",
        "newPrice": "$207 pesos"
    },
    "order": {
        "offer": "Oferta: Válida por tiempo limitado.",
        "stock": "Stock: ¡Quedan solo 10 unidades!"
    },
    "efficiency": {
        "percentage": "75% más rápido",
        "comparison": "que otros métodos de bronceado",
        "description": "Nude Bronceado te permite lograr el tono dorado de tu piel sin horas bajo el sol ni riesgos de quemaduras.",
        "image": "assets/images/imagen6.jpeg"
    },

    "negative": {
        "percentage": "❌ Dejá de exponer tu piel al sol",
        "comparison": "con métodos tradicionales",
        "description": "Con Nude Bronceado olvidate de los daños causados por la exposición al sol. No más quemaduras ni envejecimiento prematuro de la piel.",
        "image": "assets/images/imagen3.jpeg"
    },
    "negativeFeatures": [
        {
            "title": "BRONCEADO RÁPIDO",
            "description": "Resultados visibles en solo 7 días de uso continuado"
        },
        {
            "title": "MÁXIMA SEGURIDAD",
            "description": "Formulación segura, sin exposición al sol"
        },
        {
            "title": "FÓRMULA NATURAL",
            "description": "Bronceado a base de ingredientes naturales"
        },
        {
            "title": "FÁCIL DE USAR",
            "description": "Solo una pastilla diaria para un bronceado uniforme"
        }
    ],

    "featuresDark": {
        "title": {
            "main": "Pequeño en Tamaño",
            "highlight": "Grande en Bronceado"
        },
        "description": "Nude Bronceado combina comodidad y resultados rápidos para obtener un tono dorado sin riesgos.",
        "features": [
            {
                "icon": "☀️",
                "text": "Bronceado Natural y Duradero"
            },
            {
                "icon": "💊",
                "text": "Pastillas de Fácil Consumo"
            },
            {
                "icon": "🌿",
                "text": "Ingredientes 100% Naturales"
            },
            {
                "icon": "💪",
                "text": "Sin Exposición al Sol"
            },
            {
                "icon": "⏱️",
                "text": "Resultados Rápidos en 7 días"
            },
            {
                "icon": "🌞",
                "text": "Bronceado Uniforme"
            }
        ]
    },
    "reviews": {
        "ratingDistribution": [
            { "stars": 5, "count": 900 },
            { "stars": 4, "count": 200 },
            { "stars": 3, "count": 50 },
            { "stars": 2, "count": 30 },
            { "stars": 1, "count": 20 }
        ],
        "userReviews": [
            {
                "name": "Erika",
                "rating": 5,
                "verified": true,
                "comment": "Una maravilla de producto, lo recomiendo, en muy poco tiempo logras resultados con la piel",
                "image": "assets/images/review3.jpeg"
            },
            {
                "name": "Andrea daniela",
                "rating": 5,
                "verified": true,
                "comment": "Totalmente recomendado! Segundo año que lo compro y es increíble!",
                "image": "assets/images/review6.jpeg"
            },
            {
                "name": "Abel",
                "rating": 4,
                "verified": true,
                "comment": "Bueno el producto lo consumo hace varios años , para mí es el mejor , mantiene un bronceado natural y se activa al tomar un poco de sol",
                "image": "assets/images/review7.jpeg"
            },
            {
                "name": "Javiera",
                "rating": 5,
                "verified": true,
                "comment": "Llevo 14 meses tomando las cápsulas Nude y de verdad que mi tono de piel mejoró un montón, aparte cuando me bronceo solo uso factor 50, jamás bronceador y quedo café dorada en muy poco tiempo. También la calidad de mis uñas mejoró mucho, y se fueron las manchas! 20/10",
                "image": "assets/images/review4.jpeg"
            }
        ]
    },
    "faq": {
        "items": [
            {
                "question": "¿Cuanto me duran los potes?",
                "answer": "Un pote de Nude Bronceado te dura 2 meses. En esta promoción te llevás 3 potes que te alcanzarán para 6 meses en total."
            },
            {
                "question": "¿Puedo tomarlo si tengo piel sensible?",
                "answer": "Si, Nude Bronceado es apto para todo tipo de piel, incluso las más sensibles."
            },
            {
                "question": "¿Cuánto tarda en llegar mi pedido?",
                "answer": "El tiempo de entrega es de 3-8 dias hábiles dependiendo de tu ubicación."
            },
            {
                "question": "¿El producto incluye garantía?",
                "answer": "Sí, todos nuestros productos incluyen garantía de 12 meses."
            },
            {
                "question": "¿Puedo recibir asesoría antes de realizar mi pedido?",
                "answer": "¡Por supuesto! Nuestro equipo de asesores está disponible para resolver todas tus dudas antes de la compra."
            }
        ]
    }
};
  
  `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
            { role: 'system', content: 'Sos un asistente que habla en español de Mexico y me ayuda a generar objetos json para productos.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 1600,
        temperature: 0.7,
    });
    console.log(response.choices[0].message.content)
    return JSON.parse(response.choices[0].message.content);
};

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a valid Amazon product URL.' });
    }

    const { productName, productDescription, images, imagesRev } = await scrapeAmazonProductImages(url);

    // const productData = await generateProductData(productName, productDescription, images, imagesRev);

    const productData = { productName, productDescription, images, imagesRev };

    res.json(productData);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


