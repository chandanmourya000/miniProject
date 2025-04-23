const Sentiment = require('sentiment');
const sentiment = new Sentiment();
// function getProsConsFromReviews(reviews) {
//   let pros = [];
//   let cons = [];

//   reviews.forEach((review) => {
//     if (review && review.review) {  // Ensure review exists
//       const reviewText = review.review.trim(); // Trim spaces

//       // Skip empty reviews or reviews with less than 3 words
//       if (!reviewText || reviewText.split(' ').length < 3) return;

//       const result = sentiment.analyze(reviewText);  // Analyze sentiment of the whole review

//       // If sentiment is positive, add it to pros
//       if (result.score > 0) {
//         pros.push(reviewText);
//       } 
//       // If sentiment is negative, add it to cons
//       else if (result.score < 0) {
//         cons.push(reviewText);
//       } 
//       // For mixed sentiment reviews (positive + negative in one review)
//       else {
//         // Split by comma or other delimiters and analyze each part
//         const parts = reviewText.split(',');  // Split by commas (or use other delimiters)
//         parts.forEach(part => {
//           const partResult = sentiment.analyze(part.trim());
//           if (partResult.score > 0) {
//             pros.push(part.trim());
//           } else if (partResult.score < 0) {
//             cons.push(part.trim());
//           }
//         });
//       }
//     }
//   });

//   return { pros, cons };
// }

// module.exports = getProsConsFromReviews;



// function getProsConsFromReviews(reviews) {
//   let pros = [];
//   let cons = [];

//   reviews.forEach((review) => {
//     if (review && review.review) {  // Check if review and content exist
//       const reviewText = review.review.trim(); // Trim the review text

//       // Skip empty reviews or reviews with less than 3 words
//       if (!reviewText || reviewText.split(' ').length < 3) return;

//       const result = sentiment.analyze(reviewText);

//       if (result.score > 0) {
//         // If sentiment score is positive, it's a pro
//         pros.push(reviewText);
//       } else if (result.score < 0) {
//         // If sentiment score is negative, it's a con
//         cons.push(reviewText);
//       }
//     }
//   });

//   return { pros, cons };
// }

// module.exports = getProsConsFromReviews;
function getProsConsFromReviews(reviews) {
  let pros = [];
  let cons = [];

  reviews.forEach((review) => {
    if (review && review.review) {
      const reviewText = review.review.trim();

      // Skip empty or too short reviews
      if (!reviewText || reviewText.split(' ').length < 3) return;

      // Analyze sentiment of the whole review
      const result = sentiment.analyze(reviewText);

      if (result.score > 0) {
        // If overall review sentiment is positive, consider it a pro
        if (!pros.includes(reviewText)) {
          pros.push(reviewText);
        }
      } else if (result.score < 0) {
        // If overall review sentiment is negative, consider it a con
        if (!cons.includes(reviewText)) {
          cons.push(reviewText);
        }
      } else {
        // Split sentences or use 'but', 'however', etc. to find mixed reviews
        const parts = reviewText.split(/,|\band\b|\bbut\b|\bhowever\b/i);  // Split based on logical delimiters
        parts.forEach(part => {
          const partResult = sentiment.analyze(part.trim());
          if (partResult.score > 0 && !pros.includes(part.trim())) {
            pros.push(part.trim());
          } else if (partResult.score < 0 && !cons.includes(part.trim())) {
            cons.push(part.trim());
          }
        });
      }
    }
  });

  return { pros, cons };
}

module.exports = getProsConsFromReviews;
