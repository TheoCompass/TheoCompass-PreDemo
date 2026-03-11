export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Set up CORS headers so your Next.js frontend can fetch this data
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // -----------------------------------------------------------------
      // ENDPOINT 1: Scattermap Coordinates
      // Replaces: denomination_mode_summary.csv
      // -----------------------------------------------------------------
      if (url.pathname === "/api/coordinates") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM denomination_compass_coordinates"
        ).all();
        
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      // -----------------------------------------------------------------
      // ENDPOINT 2: Question Catalogue
      // -----------------------------------------------------------------
      if (url.pathname === "/api/questions") {
        try {
          // 1. Get the mode parameter from the URL (default to quick)
          const mode = url.searchParams.get('mode') || 'quick';

          // 2. Build dynamic SQL based on mode
          let filterClause = "";
          let orderClause = "";

          if (mode === 'quick') {
            filterClause = "WHERE q.include_quick = 1";
            orderClause = "ORDER BY q.display_order_quick ASC";
          } else if (mode === 'standard') {
            filterClause = "WHERE q.include_standard = 1";
            orderClause = "ORDER BY q.display_order_standard ASC";
          } else if (mode === 'deep') {
            filterClause = "WHERE q.include_deep = 1";
            orderClause = "ORDER BY q.display_order_deep ASC";
          } else {
            return new Response(JSON.stringify({ error: "Invalid mode parameter." }), { status: 400, headers: corsHeaders });
          }

          // 3. Execute the JOIN query with the dynamic clauses
          const stmt = env.DB.prepare(`
            SELECT 
              q.id as question_id, 
              q.category_code as category_code, 
              q.full_text as full_text,
              a.id as answer_record_id,
              a.answer_text as answer_text,
              a.description as answer_description
            FROM questions q
            LEFT JOIN answer_options a ON q.id = a.question_id
            ${filterClause}
            ${orderClause}
          `);

          const { results } = await stmt.all();

          // 4. Map the flat SQL results into nested JSON
          const questionsMap = new Map();

          // Because we order by display_order in SQL, the first time we see a question_id, 
          // it is in the correct sequence. A Map preserves insertion order in JavaScript!
          results.forEach((row: any) => {
            if (!questionsMap.has(row.question_id)) {
              questionsMap.set(row.question_id, {
                id: row.question_id,           
                category: row.category_code,   
                question: row.full_text,       
                answers: []
              });
            }

            if (row.answer_record_id) {
              questionsMap.get(row.question_id).answers.push({
                id: row.answer_record_id.toString(),
                text: row.answer_text,
                desc: row.answer_description || "",
                isSilence: false
              });
            }
          });

          const formattedQuestions = Array.from(questionsMap.values());
          return new Response(JSON.stringify(formattedQuestions), { headers: corsHeaders });
          
        } catch (dbError: any) {
          console.error("SQL ERROR IN /api/questions:", dbError.message);
          return new Response(JSON.stringify({ error: "SQL Error", details: dbError.message }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
      }



      // -----------------------------------------------------------------
      // ENDPOINT 3: Pairwise Alignment Matrix
      // Replaces: pairwise_alignment.json
      // -----------------------------------------------------------------
      if (url.pathname === "/api/alignment") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM pairwise_alignments"
        ).all();
        
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

            // -----------------------------------------------------------------
      // ENDPOINT 4: Get Scoring Math (GET)
      // For frontend client-side calculation (Option B)
      // -----------------------------------------------------------------
      if (url.pathname === "/api/scoring" && request.method === "GET") {
        const dimensions = await env.DB.prepare("SELECT * FROM hidden_dimensions").all();
        const answers = await env.DB.prepare("SELECT * FROM answer_scoring").all();
        
        return new Response(JSON.stringify({
          hidden_dimensions: dimensions.results,
          answer_scoring: answers.results
        }), { headers: corsHeaders });
      }


      // -----------------------------------------------------------------
      // DEFAULT: Health Check
      // -----------------------------------------------------------------
      return new Response(
        JSON.stringify({ status: "TheoCompass API Active", version: "2.0" }),
        { headers: corsHeaders, status: 200 }
      );

    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: "Database query failed", details: error.message }),
        { headers: corsHeaders, status: 500 }
      );
    }
  },
};
