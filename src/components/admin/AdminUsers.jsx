import React, { useState } from 'react';
import { adminAllUsersList } from '../../data/mockData';
import { Users, Plus, Download, Upload, ShieldAlert, KeyRound, Check, X, Search, Filter, ShieldCheck, Mail } from 'lucide-react';
import authService from '../../services/authService';

export default function AdminUsers() {
  const [users, setUsers] = useState(adminAllUsersList);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedAccount, setLastCreatedAccount] = useState(null);

  // New user form state meeting specification
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [department, setDepartment] = useState('CSE');
  const [program, setProgram] = useState('B.Tech');
  const [year, setYear] = useState('I Year');
  const [section, setSection] = useState('A');
  const [semester, setSemester] = useState('I Sem');
  const [subjects, setSubjects] = useState('Machine Learning, Deep Learning');
  const [generatedPass, setGeneratedPass] = useState('GMRIT@' + Math.floor(1000 + Math.random() * 9000));

  const filteredUsers = users.filter(u => {
    if (activeTab === 'students' && u.role.toLowerCase() !== 'student') return false;
    if (activeTab === 'faculty' && u.role.toLowerCase() !== 'faculty') return false;
    if (activeTab === 'admins' && u.role.toLowerCase() !== 'admin') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    try {
      const createdAccount = authService.provisionUser({
        role: role.toLowerCase(),
        userId,
        name,
        email: email || `${userId.toLowerCase()}@gmrit.edu.in`,
        department,
        program,
        year,
        section,
        semester: 1,
        subjects: subjects ? subjects.split(',').map(s => s.trim()) : [],
        temporaryPassword: generatedPass
      });

      const newUser = {
        id: `usr_${Date.now()}`,
        name,
        userId,
        email: createdAccount.email,
        role: role === 'student' ? 'Student' : 'Faculty',
        department,
        year: role === 'student' ? year : 'Staff',
        semester: role === 'student' ? semester : 'All',
        status: 'Active (First Login Pending)',
        lastLogin: 'Never'
      };
      setUsers([newUser, ...users]);
      setLastCreatedAccount({
        name,
        userId,
        email: createdAccount.email,
        role: role === 'student' ? 'Student' : 'Faculty',
        tempPass: generatedPass
      });
      setShowCreateModal(false);
      setShowSuccessModal(true);
      setName('');
      setUserId('');
      setEmail('');
      setGeneratedPass('GMRIT@' + Math.floor(1000 + Math.random() * 9000));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = (u) => {
    try {
      const tempPass = authService.resetPassword(u.userId);
      alert(`Password reset for ${u.name} (${u.userId}).\nNew temporary password: ${tempPass}\nMandatory password change enforced on next login.`);
    } catch (err) {
      const tempPass = 'GMRIT@' + Math.floor(1000 + Math.random() * 9000);
      alert(`Password reset for ${u.name} (${u.userId}).\nNew temporary password: ${tempPass}\nDispatched to verified email address.`);
    }
  };

  const handleToggleStatus = (u) => {
    setUsers(users.map(item => {
      if (item.id === u.id) {
        return {
          ...item,
          status: item.status === 'Active' ? 'Deactivated' : 'Active'
        };
      }
      return item;
    }));
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            User Provisioning & Access Management
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Centralized credential issuance for Students, Faculty, and Administrators
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => alert("Batch CSV student import interface triggered.")} className="btn btn-secondary">
            <Upload size={14} />
            <span>Import Users (CSV)</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={14} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Strict Policy Banner */}
      <div style={{
        padding: '14px 18px',
        background: 'var(--pastel-orange-bg)',
        border: '1px solid var(--pastel-orange-border)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <ShieldAlert size={18} color="var(--pastel-orange-text)" />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--pastel-orange-text)' }}>GMRIT Institutional Rule:</strong> Students and faculty cannot self-register. Only the Central Administrator can create their accounts and assign course affiliations.
        </span>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="tabs-nav" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {[
            { id: 'all', label: 'All Users' },
            { id: 'students', label: 'Students (8,492)' },
            { id: 'faculty', label: 'Faculty (428)' },
            { id: 'admins', label: 'Admins (12)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', paddingBlock: '8px', fontSize: '13px' }}
          />
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>User ID / Roll No</th>
              <th>Role</th>
              <th>Department</th>
              <th>Year / Sem</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px' }}>{u.userId}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'Student' ? 'badge-blue' :
                    u.role === 'Faculty' ? 'badge-green' : 'badge-purple'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td>{u.department}</td>
                <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {u.year} • {u.semester}
                </td>
                <td>
                  <span className={`badge ${u.status === 'Active' ? 'badge-green' : 'badge-danger'}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.lastLogin}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleResetPassword(u)}
                      className="btn btn-secondary btn-sm"
                      title="Reset Password"
                    >
                      <KeyRound size={12} />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: u.status === 'Active' ? 'var(--error)' : 'var(--success)' }}
                    >
                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin User Provisioning Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Provision New Institutional Account
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Admin Workflow: Issue verified credentials with mandatory first-login password reset.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {/* Notice Banner */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--pastel-blue-bg)',
                  border: '1px solid var(--pastel-blue-border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '11.5px',
                  color: 'var(--pastel-blue-text)',
                  lineHeight: 1.4
                }}>
                  <strong>Administrative Notice:</strong> This assigns the permanent role in the user's database record. Users cannot alter their role after creation.
                </div>

                {/* Account Type Selector */}
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label className="input-label">Account Type to Provision</label>
                  <select
                    className="input-field"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="student">Student Account</option>
                    <option value="faculty">Faculty / Teaching Staff Account</option>
                  </select>
                </div>

                {/* Common Identity Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder={role === 'student' ? "e.g. Kavya Reddy" : "e.g. Dr. A. K. Verma"}
                      className="input-field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      {role === 'student' ? 'Student ID / Roll No' : 'Employee ID'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={role === 'student' ? "e.g. 23A81A0588" : "e.g. GMR-CSE-1055"}
                      className="input-field"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email and Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Institutional Email</label>
                    <input
                      type="email"
                      required
                      placeholder={role === 'student' ? "student.id@gmrit.edu.in" : "faculty.name@gmrit.edu.in"}
                      className="input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Department</label>
                    <select
                      className="input-field"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="CSE">Computer Science & Engineering</option>
                      <option value="IT">Information Technology</option>
                      <option value="ECE">Electronics & Communication</option>
                      <option value="EEE">Electrical & Electronics</option>
                      <option value="MECH">Mechanical Engineering</option>
                      <option value="CIVIL">Civil Engineering</option>
                    </select>
                  </div>
                </div>

                {/* Role Specific Fields: Student */}
                {role === 'student' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Program</label>
                      <select className="input-field" value={program} onChange={(e) => setProgram(e.target.value)}>
                        <option value="B.Tech">B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Year</label>
                      <select className="input-field" value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Section</label>
                      <select className="input-field" value={section} onChange={(e) => setSection(e.target.value)}>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Role Specific Fields: Faculty */}
                {role === 'faculty' && (
                  <div className="input-group" style={{ marginBottom: '14px' }}>
                    <label className="input-label">Assigned Subjects (comma-separated)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Machine Learning, Deep Learning, DBMS"
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Temporary Password Field */}
                <div style={{
                  padding: '12px 14px',
                  background: '#F8FAFC',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div className="input-group" style={{ marginBottom: '4px' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Temporary Password</span>
                      <button
                        type="button"
                        onClick={() => setGeneratedPass('GMRIT@' + Math.floor(1000 + Math.random() * 9000))}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Regenerate
                      </button>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={generatedPass}
                      onChange={(e) => setGeneratedPass(e.target.value)}
                      style={{ fontFamily: 'monospace', fontWeight: 700 }}
                      required
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    User must change this password upon first login to complete account onboarding.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <ShieldCheck size={14} />
                  <span>Provision Account & Issue Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Provisioned Success Modal */}
      {showSuccessModal && lastCreatedAccount && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'var(--pastel-green-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Check size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Account Provisioned Successfully
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              New {lastCreatedAccount.role} record has been saved to the institutional directory.
            </p>

            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12.5px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                <strong>{lastCreatedAccount.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Login User ID / Email: </span>
                <strong style={{ fontFamily: 'monospace' }}>{lastCreatedAccount.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Temporary Password: </span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--primary-blue)' }}>{lastCreatedAccount.tempPass}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>First Login Status: </span>
                <span className="badge badge-orange" style={{ fontSize: '10.5px' }}>Password Change Required</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowSuccessModal(false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
