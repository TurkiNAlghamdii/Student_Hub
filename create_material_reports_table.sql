-- Table for material reports
CREATE TABLE IF NOT EXISTS material_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL, 
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (material_id) REFERENCES course_files (id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES students (id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_reports_material_id ON material_reports(material_id);
CREATE INDEX IF NOT EXISTS idx_material_reports_status ON material_reports(status);
CREATE INDEX IF NOT EXISTS idx_material_reports_reporter_id ON material_reports(reporter_id); 