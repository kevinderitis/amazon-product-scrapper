document.addEventListener('DOMContentLoaded', () => {
    fetch('assets/data/productData.json')
        .then(response => response.json())
        .then(data => {
            loadProductData(data);
        })
        .catch(error => {
            console.error('Error al cargar los datos del producto:', error);
        });

    setupFAQ();
    setupFormValidation();
});

function loadProductData(data) {
    document.querySelector('.zapper-text').textContent = data.product.name;
    document.querySelector('.rating-text').textContent = data.rating.text;

    const title = document.querySelector('.product-header h1');
    title.innerHTML = `<span>${data.title.first}</span><br>${data.title.second}`;

    document.querySelector('.product-image').src = data.product.image;
    document.querySelector('.trap-text').textContent = data.product.trapText;

    document.querySelector('.solution-text p').textContent = data.bottom.solution;
    document.querySelector('.ideal-text').textContent = data.bottom.ideal;

    loadFeatures(data.features);
    loadPriceBox(data.priceBox);
    loadOrderSection(data.order);
    loadEfficiency(data.efficiency);
    loadNegativeAspects(data.positive);
    loadNegativeFeatures(data.positiveFeatures);
    loadDarkFeatures(data.featuresDark);
    loadRatingDistribution(data.reviews.ratingDistribution);
    loadUserReviews(data.reviews.userReviews);
    loadFAQ(data.faq.items);
}

function loadFeatures(features) {
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach((item, index) => {
        const feature = features[index];
        item.querySelector('h3').textContent = feature.title;
        item.querySelector('p').textContent = feature.description;
    });
}

function loadPriceBox(priceBox) {
    document.querySelector('.price-box-header').textContent = priceBox.header;
    document.querySelector('.discount-text').textContent = priceBox.discount;
    document.querySelector('.original-price').textContent = priceBox.originalPrice;
    document.querySelector('.new-price').textContent = priceBox.newPrice;
}

function loadOrderSection(order) {
    document.querySelector('.offer-text').textContent = order.offer;
    document.querySelector('.stock-text span:last-child').textContent = order.stock;
}

function loadEfficiency(efficiency) {
    const efficiencyTitle = document.querySelector('.efficiency-title strong');
    efficiencyTitle.textContent = efficiency.percentage;
    efficiencyTitle.insertAdjacentText('afterend', ` ${efficiency.comparison}`);
    document.querySelector('.efficiency-description').textContent = efficiency.description;
    document.querySelector('.efficiency-image').src = efficiency.image;
}

function loadNegativeAspects(negative) {
    const negativeTitle = document.querySelector('.negative-title strong');
    negativeTitle.textContent = negative.percentage;
    negativeTitle.insertAdjacentText('afterend', ` ${negative.comparison}`);
    document.querySelector('.negative-description').textContent = negative.description;
    document.querySelector('.negative-image').src = negative.image;
}

function loadNegativeFeatures(negativeFeatures) {
    const negativeFeatureItems = document.querySelectorAll('.negative-feature-item');
    negativeFeatureItems.forEach((item, index) => {
        const feature = negativeFeatures[index];
        item.querySelector('h3').textContent = feature.title;
        item.querySelector('p').textContent = feature.description;
    });
}

function loadDarkFeatures(featuresDark) {
    const darkTitle = document.querySelector('.features-dark-title h2');
    darkTitle.querySelector('span:first-child').textContent = featuresDark.title.main;
    darkTitle.querySelector('.highlight').textContent = featuresDark.title.highlight;
    document.querySelector('.features-dark-description').textContent = featuresDark.description;

    const featuresGrid = document.querySelector('.features-dark-grid');
    featuresDark.features.forEach(feature => {
        const item = document.createElement('div');
        item.className = 'features-dark-item';
        item.innerHTML = `
            <div class="features-dark-icon">
                <span>${feature.icon}</span>
            </div>
            <span>${feature.text}</span>
        `;
        featuresGrid.appendChild(item);
    });
}

function loadRatingDistribution(ratingDistribution) {
    const ratingBars = document.querySelector('.rating-bars');
    const maxCount = Math.max(...ratingDistribution.map(r => r.count));

    ratingDistribution.forEach(rating => {
        const percentage = (rating.count / maxCount) * 100;
        const barItem = document.createElement('div');
        barItem.className = 'rating-bar-item';
        barItem.innerHTML = `
            <div class="rating-bar-stars">${'★'.repeat(rating.stars)}${'☆'.repeat(5 - rating.stars)}</div>
            <div class="rating-bar-track">
                <div class="rating-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="rating-count">${rating.count}</div>
        `;
        ratingBars.appendChild(barItem);
    });
}

function loadUserReviews(userReviews) {
    const reviewsList = document.querySelector('.reviews-list');
    userReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-user">${review.name}</div>
                ${review.verified ? '<div class="verified-badge">Comprador Verificado</div>' : ''}
            </div>
            <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            ${review.image ? `<img src="${review.image}" alt="Review image" class="review-image">` : ''}
            <p class="review-text">${review.comment}</p>
        `;
        reviewsList.appendChild(reviewCard);
    });
}

function loadFAQ(faqItems) {
    const faqList = document.querySelector('.faq-list');
    faqItems.forEach((item, index) => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.innerHTML = `
            <div class="faq-question ${index === 0 ? 'active' : ''}">
                ${item.question}
                <div class="faq-toggle"></div>
            </div>
            <div class="faq-answer">
                <div class="faq-answer-content">${item.answer}</div>
            </div>
        `;
        faqList.appendChild(faqItem);

        const question = faqItem.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const wasActive = question.classList.contains('active');
            document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
            if (!wasActive) question.classList.add('active');
        });
    });
}

function setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const wasActive = question.classList.contains('active');
            faqQuestions.forEach(q => q.classList.remove('active'));
            if (!wasActive) question.classList.add('active');
        });
    });
}

function setupFormValidation() {
    document.getElementById('phone').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
}

let productName = 'NUDE BRONCEADORAS';
let productImgURL = 'https://acdn.mitiendanube.com/stores/002/249/379/products/bd0ca5cf-6cd7-4ab5-98a9-4cd5d173fc2a-c2876100a82dbba7b417361087160284-1024-1024.webp';
let offerDomain = 'https://secure.worldwideoffer.online';
let offerId = 1127;

function handleSubmit(event) {
    event.preventDefault();
    const url = `${offerDomain}/?offer=${offerId}&uid=0193b647-fbf3-706c-83eb-0961598572d6&subid4=${productName}&utm_medium=${productImgURL}`;
    window.open(url, '_blank');
    return false;
}