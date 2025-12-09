-- Function to update on_chain status for task_ratings based on task_rating_skills
-- This function marks a task_rating as on_chain = true if all its skills are on_chain = true

CREATE OR REPLACE FUNCTION update_task_ratings_on_chain_status()
RETURNS void AS $$
BEGIN
  UPDATE task_ratings
  SET on_chain = NOT EXISTS (
    SELECT 1 FROM task_rating_skills 
    WHERE task_rating_skills.rating_id = task_ratings.id 
    AND task_rating_skills.on_chain = false
  );
END;
$$ LANGUAGE plpgsql;

-- To execute this function, run:
-- SELECT update_task_ratings_on_chain_status();