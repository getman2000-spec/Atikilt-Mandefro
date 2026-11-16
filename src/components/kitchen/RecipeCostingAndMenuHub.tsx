/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kitchen Recipe Costing, Menu Engineering & Food Cost Variance Hub
 * Standardized Recipe Master Cards with Yield % Calculation, BCG Menu Engineering Matrix
 * (Stars, Plowhorses, Puzzles, Dogs), and Theoretical vs Actual Food Cost Variance Reconciliation.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Hotel,
  Outlet,
  RecipeCard,
  FoodCostVarianceRecord,
  RecipeCategory,
  RecipeIngredient,
  MenuEngineeringClass,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { PageHeader, KpiCard, StatusBadge, EmptyState, Modal, SampleDataBadge } from '../ui';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';
import {
  Utensils,
  ChefHat,
  PieChart,
  Scale,
  TrendingUp,
  Plus,
  Search,
  Clock,
  Award,
  Sparkles,
  AlertTriangle,
  Info,
  X,
  Download,
  Eye,
  Percent,
  Wallet,
} from 'lucide-react';

interface RecipeCostingAndMenuHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

const DEFAULT_OUTLET_OPTIONS = [
  { id: 'out_main_dining', name: 'Main Dining Restaurant' },
  { id: 'out_banquets', name: 'Banqueting & MICE Kitchen' },
  { id: 'out_pool_bar', name: 'Poolside Bar & Grill' },
  { id: 'out_room_service', name: '24/7 Room Service Kitchen' },
];

export const RecipeCostingAndMenuHub: React.FC<RecipeCostingAndMenuHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<'recipes' | 'menu_matrix' | 'variance_audit'>('recipes');

  const [recipes, setRecipes] = useState<RecipeCard[]>(() =>
    hotelId ? saasStorage.getRecipeCards(hotelId) : []
  );
  const [variances, setVariances] = useState<FoodCostVarianceRecord[]>(() =>
    hotelId ? saasStorage.getFoodCostVariances(hotelId) : []
  );
  const [outlets, setOutlets] = useState<Outlet[]>(() =>
    hotelId ? saasStorage.getOutlets(hotelId) : []
  );

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [recipeSearch, setRecipeSearch] = useState<string>('');

  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [showVarianceModal, setShowVarianceModal] = useState<boolean>(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeCard | null>(null);

  const outletOptions = useMemo(() => {
    if (outlets.length > 0) {
      return outlets.map((o) => ({ id: o.id, name: o.name }));
    }
    return DEFAULT_OUTLET_OPTIONS;
  }, [outlets]);

  const [newRecipe, setNewRecipe] = useState<{
    recipeCode: string;
    dishName: string;
    outletId: string;
    category: RecipeCategory;
    servingPortions: number;
    prepTimeMinutes: number;
    sellingPrice: number;
    targetFoodCostPercentage: number;
    allergens: string;
    chefInstructions: string;
    menuClassification: MenuEngineeringClass;
    monthlyUnitsSold: number;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      unitCost: number;
      yieldPercentage: number;
    }>;
  }>({
    recipeCode: `RCP-${Math.floor(100 + Math.random() * 900)}`,
    dishName: '',
    outletId: outletOptions[0]?.id || 'out_main_dining',
    category: 'main_course',
    servingPortions: 1,
    prepTimeMinutes: 20,
    sellingPrice: 650,
    targetFoodCostPercentage: 30,
    allergens: 'Dairy, Gluten',
    chefInstructions: '',
    menuClassification: 'star',
    monthlyUnitsSold: 150,
    ingredients: [
      {
        name: 'Primary Protein Cut',
        quantity: 0.3,
        unit: 'kg',
        unitCost: 450,
        yieldPercentage: 85,
      },
      {
        name: 'Cooking Oil & Seasoning',
        quantity: 0.05,
        unit: 'liters',
        unitCost: 280,
        yieldPercentage: 100,
      },
    ],
  });

  const [newVariance, setNewVariance] = useState<{
    outletId: string;
    periodMonth: string;
    totalFoodSales: number;
    theoreticalCost: number;
    actualFoodCost: number;
    notes: string;
  }>({
    outletId: outletOptions[0]?.id || 'out_main_dining',
    periodMonth: new Date().toISOString().slice(0, 7),
    totalFoodSales: 1500000,
    theoreticalCost: 420000,
    actualFoodCost: 442500,
    notes: 'Monthly kitchen inventory reconciliation audit.',
  });

  useEffect(() => {
    if (!hotelId) {
      setRecipes([]);
      setVariances([]);
      setOutlets([]);
      return;
    }
    const loadedOutlets = saasStorage.getOutlets(hotelId);
    setRecipes(saasStorage.getRecipeCards(hotelId));
    setVariances(saasStorage.getFoodCostVariances(hotelId));
    setOutlets(loadedOutlets);
    const defaultOutletId = loadedOutlets[0]?.id || 'out_main_dining';
    setNewRecipe((prev) => ({ ...prev, outletId: defaultOutletId }));
    setNewVariance((prev) => ({ ...prev, outletId: defaultOutletId }));
    setSelectedRecipeDetail(null);
    setShowRecipeModal(false);
    setShowVarianceModal(false);
  }, [hotelId]);

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'chef@property.local',
      fullName: currentUser?.fullName || 'Executive Chef',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const refreshRecipes = () => setRecipes(hotelId ? saasStorage.getRecipeCards(hotelId) : []);
  const refreshVariances = () => setVariances(hotelId ? saasStorage.getFoodCostVariances(hotelId) : []);

  const resolveOutletName = (outletId: string) => {
    const match = outletOptions.find((o) => o.id === outletId);
    if (match) return match.name;
    return outletId.replace('out_', '').replace(/_/g, ' ');
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
      const q = recipeSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.dishName.toLowerCase().includes(q) ||
        r.recipeCode.toLowerCase().includes(q) ||
        r.allergens.some((a) => a.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [recipes, categoryFilter, recipeSearch]);

  const stars = useMemo(() => recipes.filter((r) => r.menuClassification === 'star'), [recipes]);
  const plowhorses = useMemo(() => recipes.filter((r) => r.menuClassification === 'plowhorse'), [recipes]);
  const puzzles = useMemo(() => recipes.filter((r) => r.menuClassification === 'puzzle'), [recipes]);
  const dogs = useMemo(() => recipes.filter((r) => r.menuClassification === 'dog'), [recipes]);

  const avgFoodCostPercent = useMemo(() => {
    if (recipes.length === 0) return 0;
    const sum = recipes.reduce((acc, curr) => acc + curr.foodCostPercentage, 0);
    return Number((sum / recipes.length).toFixed(1));
  }, [recipes]);

  const totalMonthlyGrossProfit = useMemo(() => {
    return recipes.reduce((acc, curr) => acc + curr.grossProfit * curr.monthlyUnitsSold, 0);
  }, [recipes]);

  const liveModalPortionCost = useMemo(() => {
    const totalBatch = newRecipe.ingredients.reduce((sum, ing) => {
      const grossQty = Number(ing.quantity) || 0;
      const yieldDec = (Number(ing.yieldPercentage) || 100) / 100;
      return sum + (grossQty * (Number(ing.unitCost) || 0)) / (yieldDec || 1);
    }, 0);
    return Math.round((totalBatch / Math.max(1, Number(newRecipe.servingPortions) || 1)) * 100) / 100;
  }, [newRecipe.ingredients, newRecipe.servingPortions]);

  const liveModalFoodCostPct = useMemo(() => {
    if (!newRecipe.sellingPrice) return 0;
    return Number(((liveModalPortionCost / newRecipe.sellingPrice) * 100).toFixed(1));
  }, [liveModalPortionCost, newRecipe.sellingPrice]);

  const addIngredientRow = () => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          name: '',
          quantity: 0.1,
          unit: 'kg',
          unitCost: 150,
          yieldPercentage: 100,
        },
      ],
    }));
  };

  const removeIngredientRow = (idx: number) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const updateIngredientRow = (idx: number, field: string, value: string | number) => {
    setNewRecipe((prev) => {
      const items = [...prev.ingredients];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, ingredients: items };
    });
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newRecipe.dishName.trim() || newRecipe.ingredients.length === 0) return;

    const computedIngredients: RecipeIngredient[] = newRecipe.ingredients.map((ing, idx) => {
      const grossQty = Number(ing.quantity);
      const yieldDec = (Number(ing.yieldPercentage) || 100) / 100;
      const costContribution =
        Math.round(((grossQty * Number(ing.unitCost)) / (yieldDec || 1)) * 100) / 100;
      return {
        ingredientId: `ing_${idx}_${Date.now()}`,
        name: ing.name,
        quantity: grossQty,
        unit: ing.unit,
        unitCost: Number(ing.unitCost),
        yieldPercentage: Number(ing.yieldPercentage),
        costContribution,
      };
    });

    const allergensList = newRecipe.allergens
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    saasStorage.createRecipeCard(
      {
        hotelId,
        recipeCode: newRecipe.recipeCode,
        dishName: newRecipe.dishName.trim(),
        outletId: newRecipe.outletId,
        category: newRecipe.category,
        servingPortions: Number(newRecipe.servingPortions) || 1,
        prepTimeMinutes: Number(newRecipe.prepTimeMinutes) || 15,
        sellingPrice: Number(newRecipe.sellingPrice),
        targetFoodCostPercentage: Number(newRecipe.targetFoodCostPercentage) || 30,
        ingredients: computedIngredients,
        allergens: allergensList,
        chefInstructions: newRecipe.chefInstructions,
        menuClassification: newRecipe.menuClassification,
        monthlyUnitsSold: Number(newRecipe.monthlyUnitsSold) || 50,
      },
      actor
    );

    refreshRecipes();
    setShowRecipeModal(false);
    setNewRecipe((prev) => ({
      ...prev,
      recipeCode: `RCP-${Math.floor(100 + Math.random() * 900)}`,
      dishName: '',
      chefInstructions: '',
    }));
    toast('Recipe card saved', {
      description: `${newRecipe.dishName} (${newRecipe.recipeCode}) added to master recipes.`,
      variant: 'success',
    });
  };

  const handleCreateVariance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    const sales = Number(newVariance.totalFoodSales);
    const theoCost = Number(newVariance.theoreticalCost);
    const actCost = Number(newVariance.actualFoodCost);
    const varianceAmount = actCost - theoCost;
    const variancePercentage = Number(((varianceAmount / (sales || 1)) * 100).toFixed(1));
    const theoCostPercent = Number(((theoCost / (sales || 1)) * 100).toFixed(1));
    const actCostPercent = Number(((actCost / (sales || 1)) * 100).toFixed(1));

    let status: FoodCostVarianceRecord['status'] = 'acceptable';
    if (variancePercentage > 3.0) {
      status = 'critical_investigation';
    } else if (variancePercentage > 1.5) {
      status = 'warning';
    }

    saasStorage.recordFoodCostVariance(
      {
        hotelId,
        outletId: newVariance.outletId,
        periodMonth: newVariance.periodMonth,
        totalFoodSales: sales,
        theoreticalCost: theoCost,
        theoreticalCostPercentage: theoCostPercent,
        actualFoodCost: actCost,
        actualCostPercentage: actCostPercent,
        varianceAmount,
        variancePercentage,
        status,
        notes: newVariance.notes,
        auditedBy: actor.fullName,
      },
      actor
    );

    refreshVariances();
    setShowVarianceModal(false);
    toast('Food cost variance audited', {
      description: `Period ${newVariance.periodMonth} recorded (${variancePercentage}% variance).`,
      variant: status === 'critical_investigation' ? 'warning' : 'success',
    });
  };

  const handleExportRecipesCsv = () => {
    const headers = [
      'Recipe Code',
      'Dish Name',
      'Category',
      'Menu Matrix',
      `Selling Price (${currency})`,
      `Portion Cost (${currency})`,
      'Food Cost %',
      'Target %',
      `Gross Profit (${currency})`,
      'Monthly Sold',
    ];
    const rows = filteredRecipes.map((r) => [
      r.recipeCode,
      r.dishName,
      r.category,
      r.menuClassification,
      r.sellingPrice,
      r.portionCost,
      r.foodCostPercentage,
      r.targetFoodCostPercentage,
      r.grossProfit,
      r.monthlyUnitsSold,
    ]);
    downloadCsvFile(
      `recipes-matrix-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
    toast('Recipe matrix exported', {
      description: `${filteredRecipes.length} recipe cards exported to CSV.`,
      variant: 'info',
    });
  };

  const getCategoryLabel = (cat: RecipeCategory) => {
    switch (cat) {
      case 'main_course':
        return 'Main Course';
      case 'appetizer':
        return 'Appetizer';
      case 'dessert':
        return 'Dessert';
      case 'beverage':
        return 'Beverage';
      case 'banquet_buffet':
        return 'Banquet Buffet';
      default:
        return cat;
    }
  };

  const getMatrixStatus = (cls: MenuEngineeringClass) => {
    switch (cls) {
      case 'star':
        return <StatusBadge label="Star" tone="success" />;
      case 'plowhorse':
        return <StatusBadge label="Plowhorse" tone="forest" />;
      case 'puzzle':
        return <StatusBadge label="Puzzle" tone="warning" />;
      case 'dog':
        return <StatusBadge label="Dog" tone="neutral" />;
    }
  };

  const tabs = [
    { id: 'recipes' as const, label: 'Master Recipe Cards', count: recipes.length, icon: Utensils },
    { id: 'menu_matrix' as const, label: 'Menu Engineering Matrix', count: recipes.length, icon: PieChart },
    { id: 'variance_audit' as const, label: 'Food Cost Variance Audit', count: variances.length, icon: Scale },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'F&B & Culinary', 'Recipe & Menu Matrix']}
        title="Recipe Costing & Menu Engineering"
        subtitle="Standardized master recipe cards with usable yield calculations, BCG menu profitability quadrants, and theoretical vs. actual food cost audits."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{activeHotel?.name || 'Active Property'}</span>
            <span>·</span>
            <span className="font-mono">{currency}</span>
            <span>·</span>
            <span>{recipes.length} Master Recipes</span>
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleExportRecipesCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#78837D]" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowVarianceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <Scale className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
              Audit Variance
            </button>
            <button
              type="button"
              onClick={() => setShowRecipeModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Cost New Recipe
            </button>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Average Food Cost"
          value={`${avgFoodCostPercent}%`}
          delta="Target ≤ 30%"
          deltaTone={avgFoodCostPercent <= 30 ? 'positive' : 'warning'}
          helper="Across active master cards"
          icon={Percent}
        />
        <KpiCard
          label="Master Recipes"
          value={recipes.length}
          delta={`${stars.length} Stars`}
          deltaTone="forest"
          helper="100% yield-adjusted costing"
          icon={ChefHat}
        />
        <KpiCard
          label="Monthly Gross Margin"
          value={formatCurrency(totalMonthlyGrossProfit, currency, currencySymbol, { compact: true })}
          deltaTone="positive"
          helper="Contribution across F&B outlets"
          icon={Wallet}
        />
        <KpiCard
          label="Variance Audits"
          value={variances.length}
          delta={
            variances.some((v) => v.status === 'critical_investigation')
              ? `${variances.filter((v) => v.status === 'critical_investigation').length} Critical`
              : 'Within Tolerance'
          }
          deltaTone={variances.some((v) => v.status === 'critical_investigation') ? 'critical' : 'positive'}
          helper="Theoretical vs. store issue"
          icon={Scale}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#ECF1EE] font-semibold'
                  : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#F1F4F1] dark:bg-[#192622] text-[10px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STANDARDIZED RECIPE MASTER CARDS */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search dish, recipe code, or allergen..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Culinary Categories</option>
                <option value="main_course">Main Courses</option>
                <option value="appetizer">Appetizers &amp; Salads</option>
                <option value="dessert">Pastry &amp; Desserts</option>
                <option value="beverage">Craft Beverages</option>
                <option value="banquet_buffet">Buffet &amp; Banqueting</option>
              </select>
            </div>
          </div>

          {filteredRecipes.length === 0 ? (
            <EmptyState
              icon={ChefHat}
              title="No matching recipe cards"
              description="Adjust your search or category filter, or create a new standardized recipe card with ingredient yields."
              action={
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cost New Recipe
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredRecipes.map((recipe) => {
                const onTarget = recipe.foodCostPercentage <= recipe.targetFoodCostPercentage;
                return (
                  <div key={recipe.id} className="seam-surface p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-md">
                            {recipe.recipeCode}
                          </span>
                          <StatusBadge label={getCategoryLabel(recipe.category)} tone="neutral" showIcon={false} />
                          {getMatrixStatus(recipe.menuClassification)}
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#78837D] dark:text-[#92A199]">
                            <Clock className="w-3 h-3" />
                            {recipe.prepTimeMinutes} mins
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {recipe.dishName}
                        </h3>
                        {recipe.chefInstructions && (
                          <p className="text-xs text-[#78837D] dark:text-[#92A199] max-w-2xl">
                            {recipe.chefInstructions}
                          </p>
                        )}

                        {recipe.allergens.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Allergens:</span>
                            {recipe.allergens.map((alg, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-5 lg:gap-6 shrink-0">
                        <div className="text-right">
                          <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">Selling Price</span>
                          <span className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(recipe.sellingPrice, currency, currencySymbol)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">Portion Cost</span>
                          <span className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(recipe.portionCost, currency, currencySymbol)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">Food Cost %</span>
                          <span
                            className={`text-sm font-semibold font-mono tabular-nums ${
                              onTarget
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {recipe.foodCostPercentage}%
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">Gross Profit</span>
                          <span className="text-sm font-semibold font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B]">
                            +{formatCurrency(recipe.grossProfit, currency, currencySymbol)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedRecipeDetail(recipe)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#78837D]" />
                          Inspect
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
                      <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mb-2 flex items-center justify-between">
                        <span>Ingredients Breakdown ({recipe.ingredients.length} items)</span>
                        <span className="font-mono">Costed: {formatShortDate(recipe.lastCostedDate)}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {recipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="seam-surface-subtle p-2.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                                {ing.name}
                              </div>
                              <div className="text-[10px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums">
                                {ing.quantity} {ing.unit} net · {ing.yieldPercentage}% usable yield
                              </div>
                            </div>
                            <div className="font-mono tabular-nums font-semibold text-[#173F35] dark:text-[#C6A15B] shrink-0">
                              {formatCurrency(ing.costContribution, currency, currencySymbol)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU ENGINEERING MATRIX (BCG QUADRANTS) */}
      {activeTab === 'menu_matrix' && (
        <div className="space-y-4">
          <div className="seam-surface p-4 flex items-start gap-3 text-xs text-[#78837D] dark:text-[#92A199]">
            <Info className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#202B27] dark:text-[#ECF1EE]">
                Hospitality Menu Engineering Matrix:
              </strong>{' '}
              Classifies dishes by <strong>Contribution Margin</strong> versus <strong>Sales Velocity</strong> to guide
              menu placement, repricing, and recipe reformulation.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'stars',
                title: 'Stars (High Profit · High Volume)',
                subtitle: 'Maintain recipe standards & highlight on prime menu real estate.',
                items: stars,
                tone: 'success' as const,
                icon: Award,
              },
              {
                key: 'plowhorses',
                title: 'Plowhorses (Low Profit · High Volume)',
                subtitle: 'Trim ingredient waste or test modest price adjustments.',
                items: plowhorses,
                tone: 'forest' as const,
                icon: TrendingUp,
              },
              {
                key: 'puzzles',
                title: 'Puzzles (High Profit · Low Volume)',
                subtitle: 'Train service staff to upsell & feature as chef specials.',
                items: puzzles,
                tone: 'warning' as const,
                icon: Sparkles,
              },
              {
                key: 'dogs',
                title: 'Dogs (Low Profit · Low Volume)',
                subtitle: 'Re-engineer ingredient yield or rotate off the seasonal menu.',
                items: dogs,
                tone: 'neutral' as const,
                icon: AlertTriangle,
              },
            ].map((quad) => {
              const Icon = quad.icon;
              return (
                <div key={quad.key} className="seam-surface p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-center text-[#173F35] dark:text-[#C6A15B] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                          {quad.title}
                        </h3>
                        <p className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5">
                          {quad.subtitle}
                        </p>
                      </div>
                    </div>
                    <StatusBadge label={`${quad.items.length} Dishes`} tone={quad.tone} showIcon={false} />
                  </div>

                  {quad.items.length === 0 ? (
                    <div className="seam-surface-subtle p-4 text-center text-xs text-[#78837D] dark:text-[#92A199]">
                      No dishes classified in this quadrant.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quad.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedRecipeDetail(item)}
                          className="seam-surface-subtle p-3 flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-[#647B52] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                              {item.dishName}
                            </div>
                            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums mt-0.5">
                              {item.monthlyUnitsSold} sold/mo · Cost {item.foodCostPercentage}%
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                              +{formatCurrency(item.grossProfit, currency, currencySymbol)}
                            </div>
                            <div className="text-[10px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums">
                              Menu: {formatCurrency(item.sellingPrice, currency, currencySymbol)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: THEORETICAL VS ACTUAL VARIANCE AUDIT */}
      {activeTab === 'variance_audit' && (
        <div className="space-y-3">
          {variances.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No monthly variance audits recorded"
              description="Reconcile POS theoretical recipe costs against physical store issues to detect portion drift or spoilage."
              action={
                <button
                  type="button"
                  onClick={() => setShowVarianceModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Audit Monthly Variance
                </button>
              }
            />
          ) : (
            variances.map((rec) => {
              const tone =
                rec.status === 'acceptable'
                  ? 'success'
                  : rec.status === 'warning'
                  ? 'warning'
                  : 'critical';
              const statusLabel =
                rec.status === 'acceptable'
                  ? 'Acceptable (< 1.5%)'
                  : rec.status === 'warning'
                  ? 'Elevated Variance (1.5–3%)'
                  : 'Critical Spoilage / Hold';

              return (
                <div key={rec.id} className="seam-surface p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          Period {rec.periodMonth}
                        </span>
                        <StatusBadge label={resolveOutletName(rec.outletId)} tone="neutral" showIcon={false} />
                        <StatusBadge label={statusLabel} tone={tone} />
                      </div>
                      <p className="text-xs text-[#78837D] dark:text-[#92A199] max-w-3xl">{rec.notes}</p>
                      <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                        Audited by:{' '}
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {rec.auditedBy}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        Net Variance Gap
                      </span>
                      <div
                        className={`text-lg font-semibold font-mono tabular-nums ${
                          rec.status === 'acceptable'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {rec.varianceAmount >= 0 ? '+' : ''}
                        {formatCurrency(rec.varianceAmount, currency, currencySymbol)}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
                        {rec.variancePercentage}% of food sales
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
                    <div className="seam-surface-subtle p-3">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        1. Gross Food Sales
                      </span>
                      <div className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                        {formatCurrency(rec.totalFoodSales, currency, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">POS billed</span>
                    </div>

                    <div className="seam-surface-subtle p-3">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        2. Theoretical Cost
                      </span>
                      <div className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                        {formatCurrency(rec.theoreticalCost, currency, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">
                        {rec.theoreticalCostPercentage}% standard recipe sum
                      </span>
                    </div>

                    <div className="seam-surface-subtle p-3">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        3. Actual Food Cost
                      </span>
                      <div className="text-sm font-semibold font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B] mt-1">
                        {formatCurrency(rec.actualFoodCost, currency, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">
                        {rec.actualCostPercentage}% store issue intake
                      </span>
                    </div>

                    <div className="seam-surface-subtle p-3">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        4. Variance Slippage
                      </span>
                      <div
                        className={`text-sm font-semibold font-mono tabular-nums mt-1 ${
                          rec.status === 'acceptable'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {rec.varianceAmount >= 0 ? '+' : ''}
                        {formatCurrency(rec.varianceAmount, currency, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">
                        {rec.status === 'acceptable' ? 'Target compliance' : 'Review portioning & trim'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: INSPECT RECIPE DETAIL */}
      <Modal
        open={Boolean(selectedRecipeDetail)}
        onClose={() => setSelectedRecipeDetail(null)}
        title={selectedRecipeDetail?.dishName || 'Recipe Specification'}
        subtitle={
          selectedRecipeDetail
            ? `${selectedRecipeDetail.recipeCode} · ${getCategoryLabel(selectedRecipeDetail.category)} · ${selectedRecipeDetail.servingPortions} portion(s)`
            : undefined
        }
        maxWidthClass="max-w-2xl"
        footer={
          <button
            type="button"
            onClick={() => setSelectedRecipeDetail(null)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
          >
            Close
          </button>
        }
      >
        {selectedRecipeDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="seam-surface-subtle p-3">
                <span className="text-[11px] text-[#78837D] block">Selling Price</span>
                <span className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(selectedRecipeDetail.sellingPrice, currency, currencySymbol)}
                </span>
              </div>
              <div className="seam-surface-subtle p-3">
                <span className="text-[11px] text-[#78837D] block">Portion Cost</span>
                <span className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(selectedRecipeDetail.portionCost, currency, currencySymbol)}
                </span>
              </div>
              <div className="seam-surface-subtle p-3">
                <span className="text-[11px] text-[#78837D] block">Food Cost %</span>
                <span className="text-sm font-semibold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {selectedRecipeDetail.foodCostPercentage}%
                </span>
              </div>
              <div className="seam-surface-subtle p-3">
                <span className="text-[11px] text-[#78837D] block">Monthly Velocity</span>
                <span className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedRecipeDetail.monthlyUnitsSold} units
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-2">
                Standardized Ingredients
              </h4>
              <div className="border border-[#E6EBE7] dark:border-[#22322C] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Ingredient</th>
                      <th className="px-3 py-2 text-right font-medium">Net Portion Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Usable Yield %</th>
                      <th className="px-3 py-2 text-right font-medium">Gross Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                    {selectedRecipeDetail.ingredients.map((ing, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-[#202B27] dark:text-[#ECF1EE]">{ing.name}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {ing.quantity} {ing.unit}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{ing.yieldPercentage}%</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                          {formatCurrency(ing.costContribution, currency, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRecipeDetail.chefInstructions && (
              <div className="seam-surface-subtle p-3">
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Chef Preparation &amp; Plating Method
                </span>
                <p className="text-[#78837D] dark:text-[#92A199] leading-relaxed">
                  {selectedRecipeDetail.chefInstructions}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: COST NEW RECIPE CARD */}
      <Modal
        open={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title="Cost Master Recipe Card"
        subtitle="Define itemized ingredient quantities, trim yield percentages, and target food cost margin."
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleCreateRecipe} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Recipe Code
              </label>
              <input
                type="text"
                required
                value={newRecipe.recipeCode}
                onChange={(e) => setNewRecipe({ ...newRecipe, recipeCode: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Dish Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Pan-Seared Lake Fish with Herb Butter"
                value={newRecipe.dishName}
                onChange={(e) => setNewRecipe({ ...newRecipe, dishName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newRecipe.category}
                onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value as RecipeCategory })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="main_course">Main Course</option>
                <option value="appetizer">Appetizer / Salad</option>
                <option value="dessert">Pastry / Dessert</option>
                <option value="beverage">Craft Beverage</option>
                <option value="banquet_buffet">Buffet / Banquet</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Selling Price ({currency})
              </label>
              <input
                type="number"
                min="1"
                required
                value={newRecipe.sellingPrice}
                onChange={(e) => setNewRecipe({ ...newRecipe, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target Cost %
              </label>
              <input
                type="number"
                min="10"
                max="70"
                value={newRecipe.targetFoodCostPercentage}
                onChange={(e) =>
                  setNewRecipe({ ...newRecipe, targetFoodCostPercentage: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Prep Time (mins)
              </label>
              <input
                type="number"
                min="1"
                value={newRecipe.prepTimeMinutes}
                onChange={(e) => setNewRecipe({ ...newRecipe, prepTimeMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    Ingredient Formulations &amp; Usable Yield % (Cost = Net Qty × Unit Cost ÷ Yield%)
                  </span>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Ingredient
                  </button>
                </div>

            {newRecipe.ingredients.map((ing, idx) => (
              <div
                key={idx}
                className="seam-surface-subtle grid grid-cols-12 gap-2 p-2.5 items-end"
              >
                <div className="col-span-12 sm:col-span-4">
                  <label className="text-[10px] text-[#78837D] block mb-0.5">Ingredient</label>
                  <input
                    type="text"
                    required
                    placeholder="Item name"
                    value={ing.name}
                    onChange={(e) => updateIngredientRow(idx, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 seam-input"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-[#78837D] block mb-0.5">Net Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={ing.quantity}
                    onChange={(e) => updateIngredientRow(idx, 'quantity', Number(e.target.value))}
                    className="w-full px-2 py-1.5 seam-input font-mono tabular-nums"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-[#78837D] block mb-0.5">Unit</label>
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredientRow(idx, 'unit', e.target.value)}
                    className="w-full px-2 py-1.5 seam-input"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-[#78837D] block mb-0.5">Unit Cost</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ing.unitCost}
                    onChange={(e) => updateIngredientRow(idx, 'unitCost', Number(e.target.value))}
                    className="w-full px-2 py-1.5 seam-input font-mono tabular-nums"
                  />
                </div>
                <div className="col-span-9 sm:col-span-1">
                  <label className="text-[10px] text-[#78837D] block mb-0.5">Usable %</label>
                  <input
                    type="number"
                    min="20"
                    max="100"
                    value={ing.yieldPercentage}
                    onChange={(e) => updateIngredientRow(idx, 'yieldPercentage', Number(e.target.value))}
                    className="w-full px-1.5 py-1.5 seam-input font-mono tabular-nums"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 flex justify-end pb-1">
                  {newRecipe.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(idx)}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      aria-label="Remove ingredient"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="seam-surface-subtle p-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-[#78837D] block">Calculated Portion Cost</span>
              <span className="font-mono tabular-nums font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                {formatCurrency(liveModalPortionCost, currency, currencySymbol)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#78837D] block">Projected Food Cost %</span>
              <span
                className={`font-mono tabular-nums font-semibold text-sm ${
                  liveModalFoodCostPct <= newRecipe.targetFoodCostPercentage
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {liveModalFoodCostPct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Allergens (comma separated)
              </label>
              <input
                type="text"
                placeholder="Gluten, Dairy, Eggs, Nuts"
                value={newRecipe.allergens}
                onChange={(e) => setNewRecipe({ ...newRecipe, allergens: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Menu Matrix Quadrant
              </label>
              <select
                value={newRecipe.menuClassification}
                onChange={(e) =>
                  setNewRecipe({ ...newRecipe, menuClassification: e.target.value as MenuEngineeringClass })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="star">Star (High Profit, High Volume)</option>
                <option value="plowhorse">Plowhorse (Low Profit, High Volume)</option>
                <option value="puzzle">Puzzle (High Profit, Low Volume)</option>
                <option value="dog">Dog (Low Profit, Low Volume)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Chef Prep &amp; Plating Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Detail step-by-step culinary method and plating notes..."
              value={newRecipe.chefInstructions}
              onChange={(e) => setNewRecipe({ ...newRecipe, chefInstructions: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowRecipeModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Save Master Recipe
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD MONTHLY FOOD COST VARIANCE */}
      <Modal
        open={showVarianceModal}
        onClose={() => setShowVarianceModal(false)}
        title="Record Monthly Food Cost Variance"
        subtitle="Compare theoretical POS recipe cost against physical store issue intake."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateVariance} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Outlet / Kitchen Center
              </label>
              <select
                value={newVariance.outletId}
                onChange={(e) => setNewVariance({ ...newVariance, outletId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              >
                {outletOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Period (YYYY-MM)
              </label>
              <input
                type="month"
                required
                value={newVariance.periodMonth}
                onChange={(e) => setNewVariance({ ...newVariance, periodMonth: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Gross Food Sales ({currency})
            </label>
            <input
              type="number"
              min="1"
              required
              value={newVariance.totalFoodSales}
              onChange={(e) => setNewVariance({ ...newVariance, totalFoodSales: Number(e.target.value) })}
              className="w-full px-3 py-2 seam-input font-mono tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Theoretical Cost ({currency})
              </label>
              <input
                type="number"
                min="0"
                required
                value={newVariance.theoreticalCost}
                onChange={(e) => setNewVariance({ ...newVariance, theoreticalCost: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
              <span className="text-[10px] text-[#78837D]">From POS recipe mix</span>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Actual Food Cost ({currency})
              </label>
              <input
                type="number"
                min="0"
                required
                value={newVariance.actualFoodCost}
                onChange={(e) => setNewVariance({ ...newVariance, actualFoodCost: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
              <span className="text-[10px] text-[#78837D]">From store issues &amp; counts</span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Audit Notes &amp; Corrective Plan
            </label>
            <textarea
              rows={2}
              required
              value={newVariance.notes}
              onChange={(e) => setNewVariance({ ...newVariance, notes: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowVarianceModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Save Variance Audit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
